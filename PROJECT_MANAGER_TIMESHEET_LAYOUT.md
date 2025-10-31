# Project Manager Timesheet Routing & Day Allocation Implementation Layout

## Overview
This document outlines the implementation plan for:
1. Adding project manager assignment to projects
2. Routing employee timesheets to project managers based on project assignments
3. Providing an interface to assign number of days to employees per project

---

## Current State Analysis

### Existing Components
1. **Projects Model** (`Backend/models/projects_model.py`)
   - ✅ Has `Project` table with basic project info
   - ❌ Missing `project_manager_id` field
   - ✅ Has `EmployeeProjectAssignment` for employee-project relationships

2. **Project Allocations** (`Backend/models/project_allocation_model.py`)
   - ✅ Already has `project_allocations` table with:
     - `allocated_days` (float) - Days assigned per month
     - `consumed_days` (float) - Days consumed per month
     - `month` (YYYY-MM format)
   - ✅ Allocation system is already functional via Excel import

3. **Attendance System** (`Backend/routes/attendance_routes.py`)
   - ✅ Timesheets stored in `attendance` and `project_subtask_hours` tables
   - ✅ Currently routes to managers via `EmployeeManager` relationship
   - ❌ No project manager-based routing

---

## Implementation Plan

### Phase 1: Database Schema Changes

#### 1.1 Add Project Manager to Projects Table
**File**: `Backend/models/projects_model.py`

**Changes Needed**:
```python
class Project(SQLModel, table=True):
    # ... existing fields ...
    project_manager_id: Optional[int] = Field(default=None, foreign_key="employees.id")
    # ... rest of fields ...
```

**Database Migration Needed**:
- Add `project_manager_id` column to `projects` table
- Create foreign key constraint to `employees(id)`
- Create index on `project_manager_id` for performance

#### 1.2 Update Project Schemas
**File**: `Backend/schemas/projects_schema.py`

**Changes Needed**:
- Add `project_manager_id: Optional[int]` to `ProjectBase`, `ProjectCreate`, `ProjectRead`
- Update validation if needed

---

### Phase 2: Update Project Routes

#### 2.1 Update Create/Update Project Endpoints
**File**: `Backend/routes/project_routes.py`

**Endpoints to Modify**:
- `POST /projects/` - Accept `project_manager_id` in request
- `PUT /projects/{project_id}` - Allow updating `project_manager_id`
- `GET /projects/get_projects` - Include project manager info in response

**Changes**:
- Accept `project_manager_id` in project creation/update
- Validate that the provided ID belongs to an employee with Manager role
- Return project manager details in project listings

---

### Phase 3: Project Manager Timesheet Routing

#### 3.1 New Endpoint: Get Timesheets by Project Manager
**File**: `Backend/routes/attendance_routes.py`

**New Endpoint**:
```
GET /attendance/project-manager/{project_manager_id}
```

**Query Parameters**:
- `year` (int, required)
- `month` (int, required)
- `project_id` (int, optional) - Filter by specific project

**Logic**:
1. Get all projects where `project_manager_id = project_manager_id`
2. For each project, get all employees assigned via `employee_project_assignments`
3. Get attendance records for those employees filtered by:
   - Attendance entries that include the specific project(s)
   - Date range (year/month)
4. Include project context in response (which project the timesheet is for)

**Response Format**:
```json
{
  "project_manager_id": 123,
  "month": "2025-01",
  "projects": [
    {
      "project_id": 1,
      "project_name": "Project Alpha",
      "employees": [
        {
          "employee_id": 45,
          "name": "John Doe",
          "timesheets": [
            {
              "date": "2025-01-15",
              "status": "Present",
              "hours": 8.0,
              "subtasks": [
                {
                  "project_id": 1,
                  "project_name": "Project Alpha",
                  "sub_task": "Development",
                  "hours": 4.0
                },
                {
                  "project_id": 1,
                  "project_name": "Project Alpha",
                  "sub_task": "Testing",
                  "hours": 4.0
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

#### 3.2 Modify Existing Manager Endpoint
**File**: `Backend/routes/attendance_routes.py`

**Endpoint**: `GET /attendance/daily` and `GET /attendance/hr-daily`

**Enhancement**:
- Add optional `project_manager_id` parameter
- If provided, filter by employees assigned to projects managed by this project manager
- Can work alongside existing `manager_id` parameter

---

### Phase 4: Day Allocation Interface

#### 4.1 Enhance Employee-Project Assignment Endpoint
**File**: `Backend/routes/project_routes.py`

**Existing Endpoint**: `POST /projects/employees/{emp_id}/projects`

**Current Behavior**:
- Assigns projects to employees
- Creates entries in `employee_project_assignments`

**Enhancement Needed**:
Add ability to assign allocated days when assigning projects.

**New Request Format**:
```json
{
  "manager_id": 10,
  "projects": [
    {
      "project_id": 1,
      "project_name": "Project Alpha",
      "allocated_days": 10.0  // NEW: Days allocated for current month
    },
    {
      "project_id": 2,
      "project_name": "Project Beta",
      "allocated_days": 5.0
    }
  ],
  "month": "2025-01"  // NEW: Month for which allocation is being set
}
```

**Logic**:
1. Create/update `employee_project_assignments` entries
2. For each project with `allocated_days`:
   - Check if `project_allocation` exists for this employee, project, month
   - If exists, update `allocated_days`
   - If not, create new `project_allocation` entry
   - Reset `consumed_days` to 0.0 (optional - may want to preserve)

**Alternative**: Create separate endpoint for day allocation

#### 4.2 New Endpoint: Assign Days to Employee for Project
**File**: `Backend/routes/project_allocation_routes.py`

**New Endpoint**:
```
POST /allocations/assign-days
```

**Request Body**:
```json
{
  "employee_id": 45,
  "project_id": 1,
  "month": "2025-01",  // Format: YYYY-MM
  "allocated_days": 10.0
}
```

**Logic**:
1. Validate employee exists
2. Validate project exists
3. Validate month format
4. Check total allocation for employee in that month (should not exceed 20 days across all projects)
5. Create or update `project_allocation` entry
6. Optionally create `employee_project_assignment` if it doesn't exist

**Validation Rules**:
- Total allocated days per employee per month ≤ 20
- `allocated_days` ≥ 0
- Month format must be YYYY-MM

#### 4.3 Bulk Assign Days Interface
**New Endpoint**:
```
POST /allocations/bulk-assign-days
```

**Request Body**:
```json
{
  "assignments": [
    {
      "employee_id": 45,
      "project_id": 1,
      "month": "2025-01",
      "allocated_days": 10.0
    },
    {
      "employee_id": 46,
      "project_id": 1,
      "month": "2025-01",
      "allocated_days": 15.0
    }
  ]
}
```

**Use Case**: Assign multiple employees to a project with their day allocations at once

---

### Phase 5: Frontend Integration Points

#### 5.1 Project Management UI
**Files**: `Frontend/src/components/AccountManager/Projects.jsx` (or similar)

**Changes**:
- Add "Project Manager" dropdown/select field in project create/edit form
- Display project manager name in project list/details
- Allow changing project manager

#### 5.2 Employee-Project Assignment UI
**Files**: `Frontend/src/components/Manager/Employees.jsx` or similar

**Changes**:
- When assigning projects to employee, show field for "Allocated Days"
- Show month selector for which month the allocation is for
- Display current allocations when viewing employee details
- Show remaining days (allocated - consumed)

#### 5.3 Project Manager Timesheet View
**New Component**: `Frontend/src/components/ProjectManager/Timesheets.jsx`

**Features**:
- List all projects managed by logged-in project manager
- For each project, show:
  - List of employees assigned
  - Their timesheet entries for selected month
  - Project-specific subtasks and hours
- Filter by month, project
- Export functionality (optional)

#### 5.4 Day Allocation Dashboard
**New Component**: `Frontend/src/components/HR/ProjectDayAllocation.jsx` or similar

**Features**:
- Grid view showing employees vs projects
- Allocated days vs consumed days per cell
- Editable allocated days
- Visual indicators for:
  - Over-allocation warnings
  - Near-exhaustion (remaining days < 2)
  - Full consumption

---

### Phase 6: API Schema Updates

#### 6.1 Project Schemas
**File**: `Backend/schemas/projects_schema.py`

```python
class ProjectBase(SQLModel):
    # ... existing fields ...
    project_manager_id: Optional[int] = None

class ProjectRead(ProjectBase):
    # ... existing fields ...
    project_manager: Optional[Dict] = None  # {id, name, email}
```

#### 6.2 Allocation Schemas
**File**: `Backend/schemas/project_allocation_schema.py`

**New Schema**:
```python
class DayAssignmentRequest(SQLModel):
    employee_id: int
    project_id: int
    month: str  # YYYY-MM
    allocated_days: float

class BulkDayAssignmentRequest(SQLModel):
    assignments: List[DayAssignmentRequest]
```

#### 6.3 Attendance Response Schema
**File**: `Backend/schemas/attendance_schema.py`

**Enhancement**:
- Add project context to attendance responses
- Include project manager information when applicable

---

## Database Migration Script

### Migration: Add Project Manager to Projects
**File**: `Backend/alembic/versions/XXX_add_project_manager.py`

```python
def upgrade():
    # Add project_manager_id column
    op.add_column('projects', 
        sa.Column('project_manager_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_projects_project_manager',
        'projects', 'employees',
        ['project_manager_id'], ['id']
    )
    
    # Add index for performance
    op.create_index(
        'ix_projects_project_manager_id',
        'projects',
        ['project_manager_id']
    )
```

---

## Security & Permissions

### Access Control Rules

1. **View Timesheets as Project Manager**:
   - Only employees assigned as `project_manager_id` can view timesheets for their projects
   - Admin/HR can view all project manager timesheets

2. **Assign Days**:
   - Admin, HR, Account Manager can assign days
   - Project Manager can assign days to employees in their projects
   - Regular Manager can assign days to their direct reports

3. **Update Project Manager**:
   - Admin, HR, Account Manager can assign/change project managers
   - Project Manager cannot change themselves

---

## API Endpoints Summary

### New Endpoints
1. `GET /attendance/project-manager/{project_manager_id}` - Get timesheets for projects managed
2. `POST /allocations/assign-days` - Assign days to employee for project
3. `POST /allocations/bulk-assign-days` - Bulk assign days

### Modified Endpoints
1. `POST /projects/` - Accept `project_manager_id`
2. `PUT /projects/{project_id}` - Update `project_manager_id`
3. `GET /projects/get_projects` - Return project manager info
4. `POST /projects/employees/{emp_id}/projects` - Accept day allocations
5. `GET /attendance/daily` - Add `project_manager_id` filter option
6. `GET /attendance/hr-daily` - Add `project_manager_id` filter option

---

## Data Flow Diagrams

### Timesheet Submission Flow
```
Employee submits timesheet
    ↓
Attendance saved with project info
    ↓
System identifies projects from timesheet
    ↓
For each project, notify project manager (optional notification)
    ↓
Project manager can view via new endpoint
```

### Day Allocation Flow
```
Admin/HR/Manager assigns employee to project
    ↓
Optionally specify allocated days for month
    ↓
System creates/updates project_allocation entry
    ↓
Employee can now log time against project (validated against allocation)
```

---

## Testing Strategy

### Unit Tests
1. Project manager assignment validation
2. Day allocation validation (total ≤ 20 days)
3. Timesheet filtering by project manager

### Integration Tests
1. End-to-end: Assign project manager → Assign employee → Allocate days → Submit timesheet → View as project manager
2. Permission checks for all endpoints
3. Edge cases (multiple projects, overlapping assignments)

---

## Rollout Plan

### Phase 1 (Week 1)
- Database migration
- Model updates
- Project manager assignment feature

### Phase 2 (Week 2)
- Day allocation endpoints
- Update employee-project assignment to include days

### Phase 3 (Week 3)
- Project manager timesheet routing
- Frontend components for project manager view

### Phase 4 (Week 4)
- Frontend UI updates
- Testing and bug fixes
- Documentation

---

## Notes & Considerations

1. **Backward Compatibility**:
   - Existing projects without project managers should still work
   - Existing allocations should remain valid
   - Old endpoints should continue to work

2. **Performance**:
   - Index on `project_manager_id` in projects table
   - Consider caching project-employee relationships
   - Optimize queries for timesheet aggregation

3. **Notifications** (Future Enhancement):
   - Notify project manager when employees submit timesheets
   - Notify when allocated days are running low

4. **Reporting**:
   - Project manager dashboard showing team utilization
   - Monthly allocation vs consumption reports

5. **Multiple Project Managers** (Future):
   - Consider supporting multiple managers per project if needed

---

## Files to Modify/Create

### Backend Files
1. `Backend/models/projects_model.py` - Add project_manager_id
2. `Backend/schemas/projects_schema.py` - Update schemas
3. `Backend/routes/project_routes.py` - Update create/update endpoints
4. `Backend/routes/attendance_routes.py` - Add project manager timesheet endpoint
5. `Backend/routes/project_allocation_routes.py` - Add day assignment endpoints
6. `Backend/alembic/versions/XXX_add_project_manager.py` - Migration script

### Frontend Files (if implementing)
1. `Frontend/src/components/AccountManager/Projects.jsx` - Add project manager field
2. `Frontend/src/components/Manager/Employees.jsx` - Add day allocation UI
3. `Frontend/src/components/ProjectManager/Timesheets.jsx` - New component
4. `Frontend/src/lib/api.js` - Add new API calls

---

## Questions to Clarify

1. Can an employee be assigned as project manager for a project they're also working on?
2. Should project managers receive notifications when timesheets are submitted?
3. Can a project have multiple project managers or only one?
4. Should there be a separate role "Project Manager" or use existing "Manager" role?
5. When assigning days, should we validate against total monthly capacity (20 days) at that time?
6. Should consumed days be reset when allocated days are updated?

