import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, insert, update, delete, func, text
from models.policy_model import PolicyCategory, Policy
from schemas.policy_schema import (
    PolicyCategoryWithCount, PolicyCategoryUpdate, PolicyCategoryOut, PolicyCategoryCreate,
    PolicyOut, PolicyUpdate, PolicyCreate, PoliciesByLocation
)
from typing import List
from database import get_session
from fastapi.responses import FileResponse
from models.user_model import User

router = APIRouter(prefix="/policies", tags=["Policies"])

# Directory for file uploads
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)



@router.get("/by_user_location", response_model=List[PolicyOut])
def get_policies_by_user_and_location(
    location_id: int = Query(...),
    db: Session = Depends(get_session),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None)
):
    if not (employee_id or manager_id or hr_id):
        raise HTTPException(status_code=401, detail="Authentication required")

    result = db.execute(
        text("SELECT * FROM policies_with_details WHERE location_id = :loc_id"),
        {"loc_id": location_id}
    ).fetchall()

    if not result:
        raise HTTPException(status_code=404, detail="No policies found for this location")

    return [PolicyOut(**row._asdict()) for row in result]


def check_hr(hr_id: int, db: Session) -> bool:
    if not hr_id:
        return False

    # Query the User table to get the HR’s role
    employee = db.query(User).filter(User.id == hr_id).first()

    if not employee:
        raise HTTPException(status_code=401, detail="HR not found")

    return employee.role == "HR" or employee.role == "Admin"

@router.get("/categories", response_model=List[PolicyCategoryWithCount])
def get_categories(
    db: Session = Depends(get_session),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None)
):
    query = text("""
        SELECT id, name, created_at, updated_at, policy_count
        FROM categories_with_policy_count
        ORDER BY name
    """)
    try:
        result = db.execute(query).fetchall()
        return [PolicyCategoryWithCount(**row._asdict()) for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@router.post("/categories", response_model=PolicyCategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    category: PolicyCategoryCreate,
    db: Session = Depends(get_session),
    hr_id: int = Query(..., description="ID of the HR creating the category")
):
    # Ensure HR exists
    if not check_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="HR access required")

    # Insert with created_by
    new_category = PolicyCategory(
        name=category.name,
        created_by=hr_id
    )
    try:
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
        return new_category
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create category: {str(e)}")


@router.put("/categories/{category_id}", response_model=PolicyCategoryOut)
def update_category(
    category_id: int,
    category: PolicyCategoryUpdate,
    db: Session = Depends(get_session),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None)
):
    if not check_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="HR access required")
    stmt = update(PolicyCategory).where(PolicyCategory.id == category_id).values(**category.dict(exclude_unset=True))
    try:
        result = db.execute(stmt)
        db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        updated_category = db.query(PolicyCategory).filter(PolicyCategory.id == category_id).first()
        return updated_category
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update category: {str(e)}")

@router.delete("/categories/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(
    category_id: int,
    db: Session = Depends(get_session),
    hr_id: int = Query(None)
):
    if not check_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="HR access required")

    count = db.execute(
        select(func.count(Policy.id)).where(Policy.category_id == category_id)
    ).scalar()

    if count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with policies")

    stmt = delete(PolicyCategory).where(PolicyCategory.id == category_id)
    result = db.execute(stmt)
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Category not found")

    return {"detail": f"Category {category_id} deleted successfully"}


@router.get("/{location_id}", response_model=PoliciesByLocation)
def get_policies_by_location(
    location_id: int,
    db: Session = Depends(get_session),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None)
):
    if not (employee_id or manager_id or hr_id):
        raise HTTPException(status_code=401, detail="Authentication required")

    query = text("""
        SELECT 
            pc.id AS category_id,
            pc.name AS category_name,
            COALESCE(COUNT(p.id), 0) AS count,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', p.id,
                        'title', p.title,
                        'description', p.description,
                        'attachment_url', p.attachment_url,
                        'attachment_type', p.attachment_type,
                        'created_at', p.created_at,
                        'updated_at', p.updated_at,
                        'uploader_name', e.name,
                        'location_id', p.location_id,
                        'category_id', p.category_id,
                        'uploader_id', p.uploader_id,
                        'location_name', l.name,
                        'category_name', pc.name
                    )
                ) FILTER (WHERE p.id IS NOT NULL), '[]'
            ) AS policies
        FROM policy_categories pc
        LEFT JOIN policies p 
            ON pc.id = p.category_id AND p.location_id = :location_id
        LEFT JOIN employees e ON p.uploader_id = e.id
        LEFT JOIN locations l ON p.location_id = l.id
        GROUP BY pc.id, pc.name
        ORDER BY pc.name
    """)

    try:
        result = db.execute(query, {"location_id": location_id}).fetchall()
        categories = [
            {
                "category_id": row.category_id,
                "category_name": row.category_name,
                "count": row.count,
                "policies": row.policies
            }
            for row in result
        ]
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch policies: {str(e)}")

# @router.post("/", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
# def create_policy(
#     category_id: int,
#     title: str,
#     description: str,
#     location_id: int,
#     file: UploadFile = File(None),
#     db: Session = Depends(get_session),
#     employee_id: int = Query(None),
#     manager_id: int = Query(None),
#     hr_id: int = Query(None)
# ):
#     if not check_hr(hr_id, db):
#         raise HTTPException(status_code=403, detail="HR access required")
#     attachment_url = None
#     attachment_type = None
#     if file:
#         try:
#             file_extension = file.filename.split('.')[-1].lower()
#             if file_extension not in ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']:
#                 raise HTTPException(status_code=400, detail="Unsupported file format")
#             unique_filename = f"{uuid.uuid4()}.{file_extension}"
#             file_path = os.path.join(UPLOAD_DIR, unique_filename)
#             with open(file_path, "wb") as f:
#                 f.write(file.file.read())
#             attachment_url = file_path
#             attachment_type = file_extension
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
    
#     new_policy = Policy(
#         location_id=location_id,
#         category_id=category_id,
#         title=title,
#         description=description,
#         attachment_url=attachment_url,
#         attachment_type=attachment_type,
#         uploader_id=hr_id
#     )
#     try:
#         db.add(new_policy)
#         db.commit()
#         db.refresh(new_policy)
#         enriched = db.execute(
#     text("SELECT * FROM policies_with_details WHERE id = :id"),
#     {"id": new_policy.id}
# ).first()
#         return PolicyOut(**enriched._asdict())
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=400, detail=f"Failed to create policy: {str(e)}")


@router.post("/", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
def create_policy(
    category_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    location_id: int = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_session),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None)
):
    if not check_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="HR access required")

    attachment_url = None
    attachment_type = None

    if file:
        try:
            file_extension = file.filename.split('.')[-1].lower()
            if file_extension not in ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']:
                raise HTTPException(status_code=400, detail="Unsupported file format")

            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)

            with open(file_path, "wb") as f:
                f.write(file.file.read())

            attachment_url = file_path
            attachment_type = file_extension
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    new_policy = Policy(
        location_id=location_id,
        category_id=category_id,
        title=title,
        description=description,
        attachment_url=attachment_url,
        attachment_type=attachment_type,
        uploader_id=hr_id
    )

    try:
        db.add(new_policy)
        db.commit()
        db.refresh(new_policy)

        enriched = db.execute(
            text("SELECT * FROM policies_with_details WHERE id = :id"),
            {"id": new_policy.id}
        ).first()

        return PolicyOut(**enriched._asdict())
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create policy: {str(e)}")


@router.put("/{policy_id}", response_model=PolicyOut)
def update_policy(
    policy_id: int,
    title: str = Form(...),
    description: str = Form(...),
    category_id: int = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_session),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None)
):
    # Check HR access
    if not check_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="HR access required")

    # Prepare update data
    update_data = {
        "title": title,
        "description": description,
        "category_id": category_id
    }

    # Handle file upload
    if file:
        try:
            file_extension = file.filename.split('.')[-1].lower()
            if file_extension not in ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']:
                raise HTTPException(status_code=400, detail="Unsupported file format")

            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            with open(file_path, "wb") as f:
                f.write(file.file.read())
            
            update_data['attachment_url'] = file_path
            update_data['attachment_type'] = file_extension
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    # Execute update
    stmt = update(Policy).where(Policy.id == policy_id).values(**update_data)
    try:
        result = db.execute(stmt)
        db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Policy not found")

        # Fetch updated policy
        enriched = db.execute(
            text("SELECT * FROM policies_with_details WHERE id = :id"),
            {"id": policy_id}
        ).first()
        return PolicyOut(**enriched._asdict())
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update policy: {str(e)}")

@router.delete("/{policy_id}", status_code=status.HTTP_200_OK)
def delete_policy(
    policy_id: int,
    db: Session = Depends(get_session),
    hr_id: int = Query(None)
):
    if not check_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="HR access required")

    policy = db.execute(
        select(Policy.attachment_url).where(Policy.id == policy_id)
    ).first()

    if policy and policy.attachment_url and os.path.exists(policy.attachment_url):
        try:
            os.remove(policy.attachment_url)
        except Exception:
            pass

    stmt = delete(Policy).where(Policy.id == policy_id)
    result = db.execute(stmt)
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Policy not found")

    return {"detail": f"Policy {policy_id} deleted successfully"}


@router.get("/view/{policy_id}", response_model=PolicyOut)
def view_policy(
    policy_id: int,
    db: Session = Depends(get_session),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None)
):
    if not (employee_id or manager_id or hr_id):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    query = text("SELECT * FROM policies_with_details WHERE id = :id")
    enriched = db.execute(query, {"id": policy_id}).first()

    if not enriched:
        raise HTTPException(status_code=404, detail="Policy not found")

    return PolicyOut(**enriched._asdict())

@router.get("/download/{policy_id}")
def download_policy(
    policy_id: int,
    db: Session = Depends(get_session),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None)
):
    if not (employee_id or manager_id or hr_id):
        raise HTTPException(status_code=401, detail="Authentication required")
    policy = db.execute(
        select(Policy.attachment_url, Policy.attachment_type).where(Policy.id == policy_id)
    ).first()
    if not policy or not policy.attachment_url:
        raise HTTPException(status_code=404, detail="Policy or attachment not found")
    if not os.path.exists(policy.attachment_url):
        raise HTTPException(status_code=404, detail="File not found on server")
    return FileResponse(
        path=policy.attachment_url,
        filename=f"policy_{policy_id}.{policy.attachment_type}",
        media_type='application/octet-stream'
    )
