# Pagination Implementation Guide

## Overview
This guide explains how to implement pagination across all pages in the HRMS application for HR, Manager, IT Admin, Account Manager, and Employee roles.

## Reusable Components Created

### 1. **PaginationControls Component**
Location: `Frontend/src/components/ui/pagination-controls.jsx`

Features:
- ✅ Page navigation (First, Previous, Next, Last)
- ✅ Page size selector (10, 25, 50, 100)
- ✅ Display current range and total items
- ✅ Smart page number display with ellipsis
- ✅ Responsive design
- ✅ Disabled states for boundary pages

### 2. **usePagination Hook**
Provides easy state management for pagination:
```javascript
const {
  currentPage,
  pageSize,
  handlePageChange,
  handlePageSizeChange,
  getPaginatedData,
  getTotalPages,
  resetPagination
} = usePagination(10); // 10 = initial page size
```

## Implementation Pattern

### **Step 1: Import Dependencies**
```javascript
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
```

### **Step 2: Add Pagination State**
```javascript
const {
  currentPage,
  pageSize,
  handlePageChange,
  handlePageSizeChange,
  getPaginatedData,
  getTotalPages
} = usePagination(10);
```

### **Step 3: Filter and Paginate Data**
```javascript
// Filter data first (if needed)
const filteredData = data.filter(item => /* your filter logic */);

// Then paginate
const paginatedData = getPaginatedData(filteredData);
const totalPages = getTotalPages(filteredData.length);
```

### **Step 4: Render Paginated Data**
```javascript
{/* Render paginatedData instead of full data */}
{paginatedData.map(item => (
  // Your item component
))}
```

### **Step 5: Add Pagination Controls**
```javascript
<PaginationControls
  currentPage={currentPage}
  totalPages={totalPages}
  pageSize={pageSize}
  totalItems={filteredData.length}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
  pageSizeOptions={[10, 25, 50, 100]}
/>
```

## Example Implementations

### Example 1: HR Employee Management

```javascript
// Frontend/src/components/HR/EmployeeManagement.jsx

import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add pagination
  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    getPaginatedData,
    getTotalPages,
    resetPagination
  } = usePagination(10);

  // Reset pagination when search changes
  useEffect(() => {
    resetPagination();
  }, [searchTerm]);

  // Filter data
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate
  const paginatedEmployees = getPaginatedData(filteredEmployees);
  const totalPages = getTotalPages(filteredEmployees.length);

  return (
    <div>
      {/* Search/Filter UI */}
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search employees..."
      />

      {/* Data Table */}
      <table>
        {paginatedEmployees.map(emp => (
          <tr key={emp.id}>
            {/* Table cells */}
          </tr>
        ))}
      </table>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredEmployees.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};
```

### Example 2: Manager Leave Requests

```javascript
// Frontend/src/components/Manager/LeaveRequests.jsx

import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';

const ManagerLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    getPaginatedData,
    getTotalPages,
    resetPagination
  } = usePagination(25);

  // Reset pagination when filter changes
  useEffect(() => {
    resetPagination();
  }, [statusFilter]);

  // Filter by status
  const filteredRequests = statusFilter === 'all'
    ? leaveRequests
    : leaveRequests.filter(req => req.status === statusFilter);

  // Paginate
  const paginatedRequests = getPaginatedData(filteredRequests);
  const totalPages = getTotalPages(filteredRequests.length);

  return (
    <div>
      {/* Status Filter */}
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      {/* Leave Requests List */}
      {paginatedRequests.map(request => (
        <div key={request.id}>
          {/* Request card */}
        </div>
      ))}

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredRequests.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};
```

### Example 3: IT Admin Software Requests

```javascript
// Frontend/src/components/ITSupporter/SoftwareRequestCompletion.jsx

import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';

const SoftwareRequestCompletion = () => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const pagination = usePagination(50); // Can destructure specific properties
  const { currentPage, pageSize, handlePageChange, handlePageSizeChange } = pagination;

  // Combined filter
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.software_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginate
  const paginatedRequests = pagination.getPaginatedData(filteredRequests);
  const totalPages = pagination.getTotalPages(filteredRequests.length);

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4">
        <input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            pagination.resetPagination();
          }}
          placeholder="Search software..."
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            pagination.resetPagination();
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Requests Grid */}
      <div className="grid gap-4">
        {paginatedRequests.map(request => (
          <div key={request.id}>
            {/* Request card */}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredRequests.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};
```

## Pages That Need Pagination

### **HR Pages**
- ✅ Employee Management (`/hr/employee-management`)
- ✅ Onboarding Employees (`/hr/onboarding-employees`)
- ✅ Employee Attendance (`/hr/employees-attendance`)
- ✅ Leave Requests (`/hr/leave-requests`)
- ✅ Expense Management (`/hr/expense-management`)
- ✅ Document Collection (`/hr/document-collection`)
- ✅ Projects (`/hr/view-projects`)

### **Manager Pages**
- ✅ Employees List (`/manager/employees`)
- ✅ Leave Requests (`/manager/leave-requests`)
- ✅ Expense Management (`/manager/expense-management`)
- ✅ Software Requests (`/manager/software-requests`)

### **IT Admin Pages**
- ✅ Assets (`/it-supporter/assets`)
- ✅ Vendors (`/it-supporter/vendors`)
- ✅ Allocations (`/it-supporter/allocations`)
- ✅ Maintenance (`/it-supporter/maintanance`)
- ✅ Software Requests (`/it-supporter/software-requests`)

### **Account Manager Pages**
- ✅ Expense Management (`/account-manager/expense-management`)

### **Employee Pages**
- ✅ Leave History (if available)
- ✅ Expense History (if available)
- ✅ Software Requests (if available)

### **Admin Pages**
- ✅ All Admin pages that display lists

## Backend Support (Optional)

For better performance with large datasets, implement server-side pagination:

### Backend Endpoint Pattern
```python
@router.get("/employees")
def get_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    session: Session = Depends(get_session)
):
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Build query
    query = select(Employee)
    if search:
        query = query.where(Employee.name.ilike(f"%{search}%"))
    
    # Get total count
    total_count = session.exec(select(func.count()).select_from(query.subquery())).one()
    
    # Get paginated results
    results = session.exec(query.offset(offset).limit(page_size)).all()
    
    return {
        "items": results,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total_count / page_size)
    }
```

### Frontend with Backend Pagination
```javascript
const fetchEmployees = async () => {
  const response = await api.get('/employees', {
    params: {
      page: currentPage,
      page_size: pageSize,
      search: searchTerm
    }
  });
  
  setEmployees(response.data.items);
  setTotalPages(response.data.total_pages);
  setTotalItems(response.data.total);
};

// Fetch when page or search changes
useEffect(() => {
  fetchEmployees();
}, [currentPage, pageSize, searchTerm]);
```

## Styling Customization

The PaginationControls component accepts a `className` prop for custom styling:

```javascript
<PaginationControls
  // ... props
  className="bg-white p-4 rounded-lg shadow"
/>
```

## Best Practices

1. **Reset Pagination on Filter Changes**
   ```javascript
   useEffect(() => {
     resetPagination();
   }, [searchTerm, filterValue]);
   ```

2. **Show Empty State**
   ```javascript
   {paginatedData.length === 0 && (
     <div>No results found</div>
   )}
   ```

3. **Loading State**
   ```javascript
   {loading ? (
     <div>Loading...</div>
   ) : (
     <>
       {/* Paginated data */}
       <PaginationControls {...props} />
     </>
   )}
   ```

4. **Preserve Page Size in LocalStorage**
   ```javascript
   const [pageSize, setPageSize] = useState(() => {
     const saved = localStorage.getItem('preferredPageSize');
     return saved ? parseInt(saved) : 10;
   });
   
   const handlePageSizeChange = (newSize) => {
     localStorage.setItem('preferredPageSize', newSize);
     // ... rest of logic
   };
   ```

## Testing Checklist

- [ ] Pagination controls display correctly
- [ ] First/Last buttons work
- [ ] Previous/Next buttons work
- [ ] Page numbers are clickable
- [ ] Page size selector works (10, 25, 50, 100)
- [ ] Item count displays correctly
- [ ] Pagination resets on filter change
- [ ] No errors with empty data
- [ ] Responsive on mobile devices
- [ ] Smooth scroll to top on page change

## Migration Steps

1. Install pagination component (already done)
2. Update one page at a time
3. Test thoroughly before moving to next page
4. Optionally implement backend pagination for performance
5. Update all pages systematically

---

**Created**: October 16, 2025  
**Component Version**: 1.0  
**Status**: Ready for implementation

