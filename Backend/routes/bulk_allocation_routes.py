# routes/bulk_allocation_routes.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import asyncio
import logging
from database import get_session, get_db_session
from auth import get_current_user
from models.user_model import User
import time
import requests
from concurrent.futures import ThreadPoolExecutor
import threading

logger = logging.getLogger(__name__)
router = APIRouter()

class BulkAllocationRequest(BaseModel):
    employee_ids: List[int]
    start_month: Optional[str] = None
    end_month: Optional[str] = None
    batch_size: int = 100

class BulkAllocationResponse(BaseModel):
    request_id: str
    total_employees: int
    batch_size: int
    status: str
    message: str

class AllocationResult(BaseModel):
    employee_id: int
    allocations: List[Dict[str, Any]]
    status: str
    error: Optional[str] = None

class BulkAllocationStatus(BaseModel):
    request_id: str
    status: str
    total_requests: int
    completed_requests: int
    failed_requests: int
    pending_requests: int
    results: Optional[List[AllocationResult]] = None
    created_at: float
    completed_at: Optional[float] = None

# In-memory storage for bulk requests (in production, use Redis or database)
bulk_requests: Dict[str, BulkAllocationStatus] = {}

@router.post("/bulk-allocations", response_model=BulkAllocationResponse)
async def create_bulk_allocation_request(
    request: BulkAllocationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a bulk allocation request that processes up to 100 employees at a time
    """
    try:
        # Validate user permissions
        if current_user.role not in ["Admin", "HR", "Account Manager", "Manager"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Generate unique request ID
        request_id = f"bulk_allocation_{int(time.time())}_{current_user.id}"
        
        # Create initial status
        bulk_status = BulkAllocationStatus(
            request_id=request_id,
            status="pending",
            total_requests=len(request.employee_ids),
            completed_requests=0,
            failed_requests=0,
            pending_requests=len(request.employee_ids),
            created_at=time.time()
        )
        
        bulk_requests[request_id] = bulk_status
        
        # Start background processing
        background_tasks.add_task(
            process_bulk_allocations,
            request_id,
            request.employee_ids,
            request.start_month,
            request.end_month,
            request.batch_size,
            current_user.id
        )
        
        logger.info(f"Created bulk allocation request {request_id} for {len(request.employee_ids)} employees")
        
        return BulkAllocationResponse(
            request_id=request_id,
            total_employees=len(request.employee_ids),
            batch_size=request.batch_size,
            status="processing",
            message=f"Bulk allocation request created. Processing {len(request.employee_ids)} employees in batches of {request.batch_size}"
        )
        
    except Exception as e:
        logger.error(f"Error creating bulk allocation request: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create bulk allocation request: {str(e)}")

@router.get("/bulk-allocations/{request_id}", response_model=BulkAllocationStatus)
async def get_bulk_allocation_status(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the status of a bulk allocation request
    """
    if request_id not in bulk_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return bulk_requests[request_id]

@router.get("/bulk-allocations/{request_id}/results")
async def get_bulk_allocation_results(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the results of a completed bulk allocation request
    """
    if request_id not in bulk_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    
    bulk_status = bulk_requests[request_id]
    
    if bulk_status.status != "completed":
        raise HTTPException(status_code=400, detail="Request not completed yet")
    
    return {
        "request_id": request_id,
        "results": bulk_status.results,
        "summary": {
            "total_employees": bulk_status.total_requests,
            "successful": bulk_status.completed_requests,
            "failed": bulk_status.failed_requests,
            "success_rate": f"{(bulk_status.completed_requests / bulk_status.total_requests) * 100:.1f}%"
        }
    }

async def process_bulk_allocations(
    request_id: str,
    employee_ids: List[int],
    start_month: Optional[str],
    end_month: Optional[str],
    batch_size: int,
    user_id: int
):
    """
    Background task to process bulk allocations
    """
    try:
        logger.info(f"Starting bulk allocation processing for request {request_id}")
        
        # Update status to processing
        bulk_requests[request_id].status = "processing"
        
        # Get user's auth token (in production, store this securely)
        # For now, we'll use a placeholder - in real implementation, 
        # you'd get this from the user's session or JWT
        
        # Process employees in batches
        results = []
        total_batches = (len(employee_ids) + batch_size - 1) // batch_size
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(employee_ids))
            batch_employee_ids = employee_ids[start_idx:end_idx]
            
            logger.info(f"Processing batch {batch_num + 1}/{total_batches} with {len(batch_employee_ids)} employees")
            
            # Process this batch
            batch_results = await process_employee_batch(
                batch_employee_ids,
                start_month,
                end_month,
                user_id
            )
            
            results.extend(batch_results)
            
            # Update progress
            completed = len([r for r in results if r.status == "success"])
            failed = len([r for r in results if r.status == "error"])
            
            bulk_requests[request_id].completed_requests = completed
            bulk_requests[request_id].failed_requests = failed
            bulk_requests[request_id].pending_requests = len(employee_ids) - completed - failed
            
            # Small delay between batches to prevent overwhelming the system
            if batch_num < total_batches - 1:
                await asyncio.sleep(0.5)
        
        # Mark as completed
        bulk_requests[request_id].status = "completed"
        bulk_requests[request_id].completed_at = time.time()
        bulk_requests[request_id].results = results
        
        logger.info(f"Completed bulk allocation processing for request {request_id}")
        
    except Exception as e:
        logger.error(f"Error processing bulk allocations for request {request_id}: {e}")
        bulk_requests[request_id].status = "failed"
        bulk_requests[request_id].completed_at = time.time()

async def process_employee_batch(
    employee_ids: List[int],
    start_month: Optional[str],
    end_month: Optional[str],
    user_id: int
) -> List[AllocationResult]:
    """
    Process a batch of employees using thread pool for concurrent requests
    """
    try:
        def fetch_employee_allocations(employee_id):
            """Fetch allocations for a single employee"""
            try:
                # Use direct database query with project name join
                with get_db_session() as session:
                    from models.project_allocation_model import ProjectAllocation
                    from models.projects_model import Project
                    from sqlmodel import select, and_
                    
                    # Build query conditions
                    conditions = [ProjectAllocation.employee_id == employee_id]
                    
                    if start_month:
                        conditions.append(ProjectAllocation.month >= start_month)
                    if end_month:
                        conditions.append(ProjectAllocation.month <= end_month)
                    
                    # Query allocations with project name join
                    query = select(ProjectAllocation, Project.project_name).join(
                        Project, ProjectAllocation.project_id == Project.project_id
                    ).where(and_(*conditions))
                    
                    results = session.exec(query).all()
                    allocations = [result[0] for result in results]  # Extract ProjectAllocation objects
                    project_names = {result[0].project_id: result[1] for result in results}  # Map project_id to project_name
                    
                    # Convert to list of dictionaries
                    allocation_data = []
                    for allocation in allocations:
                        allocation_data.append({
                            "id": allocation.id,
                            "employee_id": allocation.employee_id,
                            "project_id": allocation.project_id,
                            "project_name": project_names.get(allocation.project_id, "Unknown Project"),
                            "employee_name": allocation.employee_name,
                            "company": allocation.company,
                            "client": allocation.client,
                            "month": allocation.month,
                            "allocated_days": allocation.allocated_days,
                            "consumed_days": allocation.consumed_days,
                            "remaining_days": allocation.allocated_days - allocation.consumed_days,
                            "allocation_percentage": (allocation.consumed_days / allocation.allocated_days * 100) if allocation.allocated_days > 0 else 0
                        })
                    
                    return AllocationResult(
                        employee_id=employee_id,
                        allocations=allocation_data,
                        status="success"
                    )
                    
            except Exception as e:
                logger.error(f"Error fetching allocations for employee {employee_id}: {e}")
                return AllocationResult(
                    employee_id=employee_id,
                    allocations=[],
                    status="error",
                    error=str(e)
                )
        
        # Use ThreadPoolExecutor for concurrent processing
        with ThreadPoolExecutor(max_workers=20) as executor:
            # Submit all requests
            future_to_employee = {
                executor.submit(fetch_employee_allocations, emp_id): emp_id 
                for emp_id in employee_ids
            }
            
            # Collect results
            results = []
            for future in future_to_employee:
                try:
                    result = future.result(timeout=30)  # 30 second timeout per request
                    results.append(result)
                except Exception as e:
                    employee_id = future_to_employee[future]
                    logger.error(f"Error processing employee {employee_id}: {e}")
                    results.append(AllocationResult(
                        employee_id=employee_id,
                        allocations=[],
                        status="error",
                        error=str(e)
                    ))
            
            return results
            
    except Exception as e:
        logger.error(f"Error processing employee batch: {e}")
        # Return error results for all employees in this batch
        return [
            AllocationResult(
                employee_id=emp_id,
                allocations=[],
                status="error",
                error=str(e)
            )
            for emp_id in employee_ids
        ]

@router.get("/bulk-allocations")
async def list_bulk_allocation_requests(
    current_user: User = Depends(get_current_user)
):
    """
    List all bulk allocation requests for the current user
    """
    # Filter requests by user (in production, store user_id with requests)
    user_requests = [
        request for request in bulk_requests.values()
        # Add user filtering logic here
    ]
    
    return {
        "requests": user_requests,
        "total": len(user_requests)
    }
