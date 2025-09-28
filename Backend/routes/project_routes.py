from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict
from dependencies import get_session
from auth import get_current_user
from models.user_model import User
from schemas.projects_schema import ProjectCreate, ProjectRead
from sqlmodel import select

router = APIRouter(prefix="/projects", tags=["Projects"])

# Create Project AM
@router.post("/", response_model=ProjectRead)
def create_project(
    project: ProjectCreate,
    session: Session = Depends(get_session),
  
):
    
    query = text("""
        INSERT INTO projects (
            project_name, project_objective, client_requirements,
            budget, start_date, end_date, skills_required, status, created_at
        ) VALUES (
            :project_name, :project_objective, :client_requirements,
            :budget, :start_date, :end_date, :skills_required, 'Active', NOW()
        ) RETURNING project_id, project_name, project_objective, client_requirements,
                   budget, start_date, end_date, skills_required, status, created_at
    """)

    result = session.execute(query, project.dict(exclude={"assignments", "status_logs"}))
    new_project = result.fetchone()
    session.commit()

    # Return single project
    return ProjectRead(
        project_id=new_project.project_id,
        project_name=new_project.project_name,
        project_objective=new_project.project_objective,
        client_requirements=new_project.client_requirements,
        budget=new_project.budget,
        start_date=new_project.start_date,
        end_date=new_project.end_date,
        skills_required=new_project.skills_required,
        status=new_project.status,
        created_at=new_project.created_at,
        assignments=[],
        status_logs=[]
    )



# Get all projects (for HR/Manager/AM)
@router.get("/get_projects", response_model=List[ProjectRead])
def get_all_projects(
    session: Session = Depends(get_session),
    # current_user: User = Depends(get_current_user)
):
    # Fetch all projects
    projects = session.execute(text("SELECT * FROM projects ORDER BY created_at DESC")).fetchall()
    
    result = []
    for p in projects:
        # Fetch employees assigned to this project
        rows = session.execute(text("""
            SELECT e.id AS employee_id, e.name, e.email, e.role,
                   ep.assignment_id, ep.assigned_by, ep.assigned_at
            FROM employees e
            JOIN employee_project_assignments ep ON e.id = ep.employee_id
            WHERE ep.project_id = :proj_id
        """), {"proj_id": p.project_id}).fetchall()
        
        employee_list = [
            {
                "assignment_id": row.assignment_id,
                "employee_id": row.employee_id,
                "name": row.name,
                "email": row.email,
                "role": row.role,
                "assigned_by": row.assigned_by,
                "assigned_at": row.assigned_at
            } for row in rows
        ]
        
        # Include employees in project response
        result.append(ProjectRead(
            project_id=p.project_id,
            project_name=p.project_name,
            project_objective=p.project_objective,
            client_requirements=p.client_requirements,
            budget=p.budget,
            start_date=p.start_date,
            end_date=p.end_date,
            skills_required=p.skills_required,
            status=p.status,
            created_at=p.created_at,
            assignments=employee_list,  # <-- correct structure
            status_logs=[]
        ))

    return result


# Update Project Status (HR/Manager/AM)
@router.put("/{project_id}/status")
def update_project_status(
    project_id: int,
    new_status: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["HR", "Manager", "Account Manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized to update status")

    try:
        session.execute(
            text("SELECT update_project_status(:p_project_id, :p_new_status, :p_updated_by)"),
            {"p_project_id": project_id, "p_new_status": new_status, "p_updated_by": current_user.id}
        )
        session.commit()
        return {"success": True, "message": "Project status updated successfully"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Update Project details (AM/Manager/HR)
@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    project: ProjectCreate,
    session: Session = Depends(get_session),
):
    try:
        # Update core project fields; status is managed via status route
        update_query = text(
            """
            UPDATE projects SET
                project_name = :project_name,
                project_objective = :project_objective,
                client_requirements = :client_requirements,
                budget = :budget,
                start_date = :start_date,
                end_date = :end_date,
                skills_required = :skills_required
            WHERE project_id = :project_id
            RETURNING project_id, project_name, project_objective, client_requirements,
                      budget, start_date, end_date, skills_required, status, created_at
            """
        )

        params = project.dict(exclude={"assignments", "status_logs", "status"})
        params["project_id"] = project_id
        updated = session.execute(update_query, params).fetchone()
        if not updated:
            session.rollback()
            raise HTTPException(status_code=404, detail="Project not found")

        # Fetch employees assigned to this project for response consistency
        rows = session.execute(text(
            """
            SELECT e.id AS employee_id, e.name, e.email, e.role,
                   ep.assignment_id, ep.assigned_by, ep.assigned_at
            FROM employees e
            JOIN employee_project_assignments ep ON e.id = ep.employee_id
            WHERE ep.project_id = :proj_id
            """
        ), {"proj_id": updated.project_id}).fetchall()

        employee_list = [
            {
                "assignment_id": r.assignment_id,
                "employee_id": r.employee_id,
                "name": r.name,
                "email": r.email,
                "role": r.role,
                "assigned_by": r.assigned_by,
                "assigned_at": r.assigned_at,
            }
            for r in rows
        ]

        session.commit()
        return ProjectRead(
            project_id=updated.project_id,
            project_name=updated.project_name,
            project_objective=updated.project_objective,
            client_requirements=updated.client_requirements,
            budget=updated.budget,
            start_date=updated.start_date,
            end_date=updated.end_date,
            skills_required=updated.skills_required,
            status=updated.status,
            created_at=updated.created_at,
            assignments=employee_list,
            status_logs=[],
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Fetch all active projects
@router.get("/all-projects")
def get_all_projects(
    session: Session = Depends(get_session),
    # current_user: User = Depends(get_current_user)
):
    # if current_user.role not in ["HR", "Manager"]:
    #     raise HTTPException(status_code=403, detail="Unauthorized")

    projects = session.execute(
        text("""
            SELECT project_id, project_name, status
            FROM projects
            WHERE status = 'Active'
            ORDER BY project_name
        """)
    ).fetchall()

    return [{"project_id": p.project_id, "project_name": p.project_name, "status": p.status} for p in projects]


# Fetch employees mapped to the manager
@router.get("/manager-employees")
def get_manager_employees(manager_id: int, session: Session = Depends(get_session)):
    # if current_user.role != "Manager":
    #     raise HTTPException(status_code=403, detail="Only managers can fetch their employees")

    employees = session.execute(
        text("""
            SELECT e.id, e.name, e.company_email
            FROM employees e
            JOIN employee_managers em ON e.id = em.employee_id
            WHERE em.manager_id = :mgr_id
        """),
        {"mgr_id": manager_id}

    ).fetchall()

    result = []
    for e in employees:
        # fetch HR(s)
        hrs = session.execute(
            text("""
                SELECT hr_id
                FROM employee_hrs
                WHERE employee_id = :emp_id
            """), {"emp_id": e.id}
        ).fetchall()
        hr_names = [session.execute(text("SELECT name FROM employees WHERE id = :hr_id"), {"hr_id": hr.hr_id}).scalar() for hr in hrs]

        # fetch assigned projects
        projects = session.execute(
            text("""
                SELECT p.project_name
                FROM employee_project_assignments ep
                JOIN projects p ON ep.project_id = p.project_id
                WHERE ep.employee_id = :emp_id
            """), {"emp_id": e.id}
        ).fetchall()
        project_names = [p.project_name for p in projects]

        result.append({
            "id": e.id,
            "name": e.name,
            "email": e.company_email,
            "hr": hr_names,
            "projects": project_names
        })
    return result

@router.post("/employees/{emp_id}/projects")
def assign_projects_to_employee(
    emp_id: int, 
    payload: dict, 
    session: Session = Depends(get_session),
):
    # Get manager ID from payload
    manager_id = payload.get("manager_id")
    if not manager_id:
        raise HTTPException(status_code=400, detail="manager_id is required")

    project_names = payload.get("projects", [])  # Accept empty list
    try:
        # Delete existing assignments
        session.execute(
            text("DELETE FROM employee_project_assignments WHERE employee_id = :emp_id"),
            {"emp_id": emp_id}
        )

        # Insert new assignments
        for name in project_names:
            project = session.execute(
                text("SELECT project_id FROM projects WHERE project_name = :name"),
                {"name": name}
            ).fetchone()
            if not project:
                raise HTTPException(status_code=404, detail=f"Project '{name}' not found")
            project_id = project[0]

            session.execute(
                text("""
                    INSERT INTO employee_project_assignments (employee_id, project_id, assigned_by)
                    VALUES (:emp_id, :project_id, :assigned_by)
                """),
                {"emp_id": emp_id, "project_id": project_id, "assigned_by": manager_id}
            )

        session.commit()
        return {"success": True, "message": "Projects updated successfully"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
