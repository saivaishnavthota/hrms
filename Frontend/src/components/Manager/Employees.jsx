import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Edit, Plus, X } from 'lucide-react';
import { avatarBg } from '../../lib/avatarColors';
import api from '@/lib/api'; 
import { toast } from 'react-toastify';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';
const getCurrentUser = () => {
  try {
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    const authToken = localStorage.getItem('authToken');
    return { userId: userId ? Number(userId) : null, userType, authToken };
  } catch (e) {
    return { userId: null, userType: null, authToken: null };
  }
};


const cellCls = 'px-4 py-3 border-b border-gray-200 align-top';
const headCls = 'px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-200';
const btnBase = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors';
const btnPrimary = 'px-3 py-1.5 bg-[#2D5016] text-white hover:bg-green-700';
const btnGhost = 'px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50';
const iconBtn = 'w-9 h-9 inline-flex items-center justify-center rounded-full';
const iconView = 'text-[#2D5016] hover:bg-green-100 ';
const iconEdit = 'text-indigo-600 hover:bg-indigo-100 ';
const tagCls = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'NA';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return (first + last).toUpperCase() || (first.toUpperCase()) || 'NA';
};

const getAvatarColor = (name) => avatarBg(name);

// Constants
const MAX_MONTHLY_CAPACITY = 20;
const CAPACITY_WARNING_THRESHOLD = 16;

// Calculate total allocated days for an employee
const calculateTotalAllocation = (projects) => {
  if (!Array.isArray(projects)) return 0;
  return projects.reduce((sum, p) => {
    const days = typeof p === 'object' ? (parseFloat(p.allocatedDays) || 0) : 0;
    return sum + days;
  }, 0);
};

// Determine capacity status with thresholds
const getCapacityStatus = (totalDays) => {
  if (totalDays > MAX_MONTHLY_CAPACITY) return 'exceeded';
  if (totalDays >= CAPACITY_WARNING_THRESHOLD) return 'at-capacity';
  return 'healthy';
};

// Get color classes based on status
const getStatusColors = (status) => {
  switch (status) {
    case 'exceeded':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        badge: 'bg-red-500'
      };
    case 'at-capacity':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        badge: 'bg-yellow-500'
      };
    case 'healthy':
    default:
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        badge: 'bg-green-500'
      };
  }
};

// Format status message for display
const getStatusMessage = (status, totalDays) => {
  switch (status) {
    case 'exceeded':
      return `Capacity exceeded by ${Math.round(totalDays - MAX_MONTHLY_CAPACITY)} days`;
    case 'at-capacity':
      return 'At full capacity';
    case 'healthy':
      return 'Optimal allocation';
    default:
      return '';
  }
};

// Render allocation badge component
const renderAllocationBadge = (employee) => {
  const totalDays = calculateTotalAllocation(employee.projects);
  const status = getCapacityStatus(totalDays);
  const colors = getStatusColors(status);
  
  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
        <span className={`w-2 h-2 rounded-full ${colors.badge} mr-2`}></span>
        {Math.round(totalDays)}/{MAX_MONTHLY_CAPACITY} days
      </div>
      <span className="text-xs text-gray-500">
        {getStatusMessage(status, totalDays)}
      </span>
    </div>
  );
};

const ManagerEmployees = () => {
  const { userId: managerId } = getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profile, setProfile] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projectsSummaryOpen, setProjectsSummaryOpen] = useState(false);
  const [projectsSummary, setProjectsSummary] = useState({ employeeName: '', projects: [] });
  
  // Allocation tracking state
  const [allocationSummary, setAllocationSummary] = useState({
    totalAllocated: 0,
    remainingCapacity: 20,
    status: 'healthy' // 'healthy', 'at-capacity', 'exceeded'
  });
  
  // Month selection for allocations
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // Format: YYYY-MM
  });

  // Pagination
  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    getPaginatedData,
    getTotalPages,
    resetPagination,
  } = usePagination(10);

   useEffect(() => {
    if (!managerId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Manager employees
        const { data: dataMgr } = await api.get(`/projects/manager-employees?manager_id=${managerId}`);
        const mgrEmployees = Array.isArray(dataMgr?.employees) ? dataMgr.employees : (Array.isArray(dataMgr) ? dataMgr : []);

        // All employees for type mapping
        const { data: dataAll } = await api.get('/users/employees');
        const mapType = new Map();
        const allList = Array.isArray(dataAll?.employees) ? dataAll.employees : (Array.isArray(dataAll) ? dataAll : []);
        allList.forEach((e) => {
          const id = e?.employeeId ?? e?.id ?? e?.employeeid;
          if (id != null) mapType.set(Number(id), e?.role || e?.type || e?.employment_type || 'Employee');
        });

        // Fetch allocation data for each employee using selected month
        const employeesWithAllocations = await Promise.all(
          mgrEmployees.map(async (e, idx) => {
            const id = e?.employeeId ?? e?.id ?? e?.employeeid;
            
            // Fetch allocations for the selected month for this employee
            let allocationData = [];
            try {
              const { data: allocationResponse } = await api.get('/attendance/active-projects', {
                params: { employee_id: id, month: selectedMonth }
              });
              allocationData = Array.isArray(allocationResponse) ? allocationResponse : [];
            } catch (allocationError) {
              console.warn(`Failed to fetch allocations for employee ${id} for month ${selectedMonth}:`, allocationError);
              allocationData = [];
            }

            // Convert allocation data to the format expected by our UI
            const projects = allocationData.map(project => {
              const allocatedDays = parseFloat(project.allocated_days || project.allocatedDays || 0);
              const consumedDays = parseFloat(project.consumed_days || project.consumedDays || 0);
              const remainingDays = parseFloat(project.remaining_days || project.remainingDays || 0);
              const projectId = parseInt(project.project_id || project.projectId || 0);
              
              return {
                projectName: String(project.project_name || project.projectName || ''),
                allocatedDays: isNaN(allocatedDays) ? 0 : allocatedDays,
                consumedDays: isNaN(consumedDays) ? 0 : consumedDays,
                remainingDays: isNaN(remainingDays) ? 0 : remainingDays,
                projectId: isNaN(projectId) ? 0 : projectId
              };
            });

            return {
              sNo: idx + 1,
              id: Number(id),
              name: e?.name || e?.employee_name || e?.full_name || '—',
              email: e?.company_email || e?.email || e?.companyEmail || '—',
              type: mapType.get(Number(id)) || 'Employee',
              projects: projects,
              hrList: e?.hr || e?.hr || [],
            };
          })
        );

        setEmployees(employeesWithAllocations);
      } catch (err) {
        setError(err?.message || 'Failed to load manager employees');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [managerId, selectedMonth]);

  // Reset pagination when data changes
  useEffect(() => {
    resetPagination();
  }, [employees]);

  // Function to refresh allocation data for a specific employee
  const refreshEmployeeAllocations = async (employeeId) => {
    try {
      const { data: allocationResponse } = await api.get('/attendance/active-projects', {
        params: { employee_id: employeeId, month: selectedMonth }
      });
      
      const allocationData = Array.isArray(allocationResponse) ? allocationResponse : [];
      const projects = allocationData.map(project => {
        const allocatedDays = parseFloat(project.allocated_days || project.allocatedDays || 0);
        const consumedDays = parseFloat(project.consumed_days || project.consumedDays || 0);
        const remainingDays = parseFloat(project.remaining_days || project.remainingDays || 0);
        const projectId = parseInt(project.project_id || project.projectId || 0);
        
        return {
          projectName: String(project.project_name || project.projectName || ''),
          allocatedDays: isNaN(allocatedDays) ? 0 : allocatedDays,
          consumedDays: isNaN(consumedDays) ? 0 : consumedDays,
          remainingDays: isNaN(remainingDays) ? 0 : remainingDays,
          projectId: isNaN(projectId) ? 0 : projectId
        };
      });

      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? { ...e, projects: projects } : e))
      );
    } catch (error) {
      console.error('Error refreshing allocations:', error);
    }
  };

  const openView = async (emp) => {
    setSelectedEmployee(emp);
    setViewOpen(true);
    try {
      // Fetch project allocations for the selected month instead of user profile
      const { data: allocationResponse } = await api.get('/attendance/active-projects', {
        params: { employee_id: emp.id, month: selectedMonth }
      });
      
      const allocationData = Array.isArray(allocationResponse) ? allocationResponse : [];
      
      // Convert allocation data to the format expected by our UI
      const projects = allocationData.map(project => {
        const allocatedDays = parseFloat(project.allocated_days || project.allocatedDays || 0);
        const consumedDays = parseFloat(project.consumed_days || project.consumedDays || 0);
        const remainingDays = parseFloat(project.remaining_days || project.remainingDays || 0);
        const projectId = parseInt(project.project_id || project.projectId || 0);
        
        return {
          projectName: String(project.project_name || project.projectName || ''),
          allocatedDays: isNaN(allocatedDays) ? 0 : allocatedDays,
          consumedDays: isNaN(consumedDays) ? 0 : consumedDays,
          remainingDays: isNaN(remainingDays) ? 0 : remainingDays,
          projectId: isNaN(projectId) ? 0 : projectId
        };
      });
      
      setProfile({ projects: projects });
    } catch (e) {
      console.error('Error fetching project allocations:', e);
      setProfile({ projects: [] });
    }
  };

  const openEdit = (emp) => {
    openProjects(emp);
  };

  const clearProjects = async (emp) => {
    if (!managerId) return;
    const confirmed = window.confirm(`Remove all projects for ${emp.name}?`);
    if (!confirmed) return;
    try {
      await api.post(`/projects/employees/${emp.id}/projects`, { manager_id: managerId, projects: [] });
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, projects: [] } : e)));
    } catch (e) {
      toast.error(e.message || 'Clear projects failed');
    }
  };

  const openProjects = async (emp) => {
    setSelectedEmployee(emp);
    
    try {
      // Fetch fresh allocation data for this employee for the selected month
      const { data: allocationResponse } = await api.get('/attendance/active-projects', {
        params: { employee_id: emp.id, month: selectedMonth }
      });
      
      const allocationData = Array.isArray(allocationResponse) ? allocationResponse : [];
      
      // Convert allocation data to the format expected by our UI
      const formattedProjects = allocationData.map(project => {
        const allocatedDays = parseFloat(project.allocated_days || project.allocatedDays || 0);
        const consumedDays = parseFloat(project.consumed_days || project.consumedDays || 0);
        const remainingDays = parseFloat(project.remaining_days || project.remainingDays || 0);
        const projectId = parseInt(project.project_id || project.projectId || 0);
        
        const formatted = {
          projectName: String(project.project_name || project.projectName || ''),
          allocatedDays: isNaN(allocatedDays) ? 0 : allocatedDays,
          consumedDays: isNaN(consumedDays) ? 0 : consumedDays,
          remainingDays: isNaN(remainingDays) ? 0 : remainingDays,
          projectId: isNaN(projectId) ? 0 : projectId
        };
        console.log('Formatted project:', formatted);
        return formatted;
      });
      
      console.log('Setting selectedProjects:', formattedProjects);
      
      // Validate the structure before setting state
      const validatedProjects = formattedProjects.filter(project => {
        const isValid = project && 
          typeof project.projectName === 'string' &&
          typeof project.allocatedDays === 'number' &&
          typeof project.consumedDays === 'number' &&
          typeof project.remainingDays === 'number' &&
          typeof project.projectId === 'number';
        
        if (!isValid) {
          console.error('Invalid project structure:', project);
        }
        return isValid;
      });
      
      setSelectedProjects(validatedProjects);
      setProjectsOpen(true);
      
      // Fetch available projects for selection with IDs
      const { data } = await api.get('/projects/get_projects');
      const projects = Array.isArray(data?.projects)
        ? data.projects
        : (Array.isArray(data) ? data : []);
      
      // Store projects with both name and ID for mapping
      setAllProjects(projects.map(p => ({
        id: p?.project_id || p?.id,
        name: p?.project_name_commercial || p?.project_name || p?.name
      })).filter(p => p.id && p.name));
    } catch (e) {
      console.error('Error fetching project data:', e);
      setAllProjects([]);
      toast.error('Failed to load project allocation data');
    }
  };

  // toggleProject function removed - no longer needed with new allocation UI

  const saveProjects = async () => {
    if (!selectedEmployee || !managerId) return;
    
    // Validate capacity before saving
    const totalAllocation = calculateTotalAllocation(selectedProjects);
    
    if (totalAllocation > MAX_MONTHLY_CAPACITY) {
      toast.error(`Capacity limit exceeded. Total allocation (${Math.round(totalAllocation)} days) exceeds maximum capacity of ${MAX_MONTHLY_CAPACITY} days.`);
      return;
    }
    
    // Filter out incomplete projects
    const validProjects = selectedProjects.filter(
      p => p.projectName && p.allocatedDays > 0
    );
    
    if (validProjects.length === 0) {
      toast.warn('Please add at least one project with allocated days');
      return;
    }
    
    try {
      // Get project IDs for the selected projects
      const allocations = validProjects.map(p => {
        // Find the project ID from allProjects
        const project = allProjects.find(proj => proj.name === p.projectName);
        return {
          project_id: p.projectId || project?.id || 0,
          allocated_days: p.allocatedDays
        };
      }).filter(alloc => alloc.project_id > 0);
      
      if (allocations.length === 0) {
        toast.error('No valid projects found. Please ensure projects are properly selected.');
        return;
      }
      
      // Save allocations using the new endpoint
      const response = await api.post('/api/allocations/save', {
        employee_id: selectedEmployee.id,
        month: selectedMonth,
        allocations: allocations
      });
      
      console.log('Save response:', response.data);
      
      // Refresh allocation data from server to get accurate consumed/remaining days
      await refreshEmployeeAllocations(selectedEmployee.id);
      
      setProjectsOpen(false);
      setProjectsSummary({ 
        employeeName: selectedEmployee.name, 
        projects: validProjects 
      });
      setProjectsSummaryOpen(true);
      
      const status = getCapacityStatus(totalAllocation);
      const statusMessage = status === 'at-capacity' 
        ? ' (at full capacity)' 
        : status === 'healthy' 
          ? ' (optimal allocation)' 
          : '';
      
      toast.success(`Projects allocated successfully for ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}${statusMessage}`);
    } catch (e) {
      console.error('Save projects error:', e);
      toast.error(e?.response?.data?.message || e.message || 'Failed to save project allocation');
    }
  };

  const tableRows = useMemo(() => employees, [employees])

  return (
    <div className="p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="month-selector" className="text-sm font-medium text-gray-700">
              Allocation Month:
            </label>
            <select
              id="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5016] focus:border-transparent text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() + i);
                const monthStr = date.toISOString().slice(0, 7);
                const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <option key={monthStr} value={monthStr}>
                    {monthName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {!loading && !error && tableRows.length > 0 && (
        <div className="flex justify-end mb-2">
          <PageSizeSelect
            pageSize={pageSize}
            onChange={handlePageSizeChange}
            options={[10, 20, 30, 40, 50]}
          />
        </div>
      )}

      <div className="mt-4 overflow-x-auto bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
          <p className="text-sm text-green-700 font-medium">
            Showing allocation data for: <span className="font-bold">{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </p>
        </div>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className={headCls}>S.No</th>
              <th className={headCls}>Employee Details</th>
              <th className={headCls}>HRs</th>
              <th className={headCls}>Projects</th>
              <th className={headCls}>Allocation Status</th>
              <th className={headCls}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className={cellCls} colSpan={6}>Loading…</td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td className={cellCls} colSpan={6}>
                  <div className="text-red-600">{error}</div>
                </td>
              </tr>
            )}
            {!loading && !error && tableRows.length === 0 && (
              <tr>
                <td className={cellCls} colSpan={6}>No employees found for this manager.</td>
              </tr>
            )}
            {!loading && !error && getPaginatedData(tableRows).map((emp, index) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className={cellCls}>{(currentPage - 1) * pageSize + index + 1}</td>
                <td className={cellCls}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${getAvatarColor(emp.name)}`}>
                      {getInitials(emp.name)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{emp.name}</span>
                      <span className="text-sm text-gray-600">{emp.email}</span>
                    </div>
                  </div>
                </td>
                <td className={cellCls}>
                  <div className="flex flex-wrap gap-2">
                    {(emp.hrList || []).length > 0 ? (
                      (emp.hrList || []).map((hr, i) => (
                        <span key={`${emp.id}-hr-${i}`} className={tagCls}>
                          {typeof hr === 'string' ? hr : (hr?.name || hr?.full_name || hr?.email || hr?.username || hr?.id || 'Unknown')}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No HRs</span>
                    )}
                  </div>
                </td>
                <td className={cellCls}>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">
                      {(emp.projects || []).length > 0 
                        ? `${emp.projects.length} project(s)` 
                        : 'No projects'}
                    </div>
                    {(emp.projects || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {emp.projects.slice(0, 2).map((p, i) => {
                          const projectName = p.projectName || '';
                          const allocatedDays = p.allocatedDays || 0;
                          const consumedDays = p.consumedDays || 0;
                          const remainingDays = p.remainingDays || 0;
                          return (
                            <div key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                              <div className="font-medium">{projectName}</div>
                            </div>
                          );
                        })}
                        {emp.projects.length > 2 && (
                          <span className="text-xs text-gray-500">+{emp.projects.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className={cellCls}>
                  {renderAllocationBadge(emp)}
                </td>
                <td className={cellCls}>
                  <div className="flex items-center gap-3">
                    <button className={`${iconBtn} ${iconView}`} onClick={() => openView(emp)} title="View">
                      <Eye size={16} />
                    </button>
                    <button className={`${iconBtn} ${iconEdit}`} onClick={() => openEdit(emp)} title="Edit Projects">
                      <Edit size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && !error && tableRows.length > 0 && (
        <PaginationControls
          className="mt-3"
          align="right"
          hideInfo={true}
          hidePageSize={true}
          currentPage={currentPage}
          totalPages={getTotalPages(tableRows.length)}
          pageSize={pageSize}
          totalItems={tableRows.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* View Modal */}
      {viewOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-[#2D5016] rounded-t-xl">
              <h2 className="text-lg font-semibold text-white">Project Allocations - {selectedEmployee.name}</h2>
              <button className="text-green-100 hover:text-white transition-colors p-1 rounded-full hover:bg-green-500" onClick={() => setViewOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Employee</div>
                  <div className="font-medium">{selectedEmployee.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Month</div>
                  <div className="font-medium">{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 mb-3">Project Allocations</div>
                {(profile?.projects || []).length > 0 ? (
                  <div className="space-y-3">
                    {profile.projects.map((project, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{project.projectName}</h3>
                          <span className="text-sm text-gray-500">ID: {project.projectId}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Allocated</div>
                            <div className="font-medium text-[#2D5016]">{Math.round(project.allocatedDays)} days</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Consumed</div>
                            <div className="font-medium text-orange-600">{Math.round(project.consumedDays)} days</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Remaining</div>
                            <div className={`font-medium ${project.remainingDays > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {Math.round(project.remainingDays)} days
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${project.allocatedDays > 0 ? (project.consumedDays / project.allocatedDays) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {project.allocatedDays > 0 ? 
                              `${Math.round((project.consumedDays / project.allocatedDays) * 100)}% utilized` : 
                              'No allocation'
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-lg mb-2">No project allocations found</div>
                    <div className="text-sm">This employee has no project allocations for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white/60 rounded-b-xl">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200" onClick={() => setViewOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal removed: editing projects handled via Projects Modal */}

      {/* Projects Allocation Modal */}
      {projectsOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-[#2D5016] to-green-600 rounded-t-xl flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Project Allocation</h2>
                <p className="text-sm text-green-100 mt-1">
                  Assign projects and allocate days for {selectedEmployee.name}
                </p>
                <p className="text-xs text-green-200 mt-1">
                  Month: {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button 
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all" 
                onClick={() => setProjectsOpen(false)} 
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Allocation Summary Panel */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50 flex-shrink-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Capacity Overview</h3>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                    getStatusColors(getCapacityStatus(calculateTotalAllocation(selectedProjects))).bg
                  } ${
                    getStatusColors(getCapacityStatus(calculateTotalAllocation(selectedProjects))).text
                  } border ${
                    getStatusColors(getCapacityStatus(calculateTotalAllocation(selectedProjects))).border
                  }`}>
                    {Math.round(calculateTotalAllocation(selectedProjects))}/{MAX_MONTHLY_CAPACITY} Days
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        getStatusColors(getCapacityStatus(calculateTotalAllocation(selectedProjects))).badge
                      }`}
                      style={{ 
                        width: `${Math.min((calculateTotalAllocation(selectedProjects) / MAX_MONTHLY_CAPACITY) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>0 days</span>
                    <span className="font-medium">
                      {Math.round(MAX_MONTHLY_CAPACITY - calculateTotalAllocation(selectedProjects))} days remaining
                    </span>
                    <span>{MAX_MONTHLY_CAPACITY} days</span>
                  </div>
                </div>

                {/* Status Message */}
                {calculateTotalAllocation(selectedProjects) > MAX_MONTHLY_CAPACITY && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900">Capacity Limit Exceeded</p>
                      <p className="text-xs text-red-700">
                        Allocation exceeds monthly capacity by {Math.round(calculateTotalAllocation(selectedProjects) - MAX_MONTHLY_CAPACITY)} days. 
                        Please reduce project allocations before saving.
                      </p>
                    </div>
                  </div>
                )}

                {calculateTotalAllocation(selectedProjects) >= CAPACITY_WARNING_THRESHOLD && 
                 calculateTotalAllocation(selectedProjects) <= MAX_MONTHLY_CAPACITY && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">⚠</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900">Near Capacity</p>
                      <p className="text-xs text-yellow-700">
                        Employee is at {Math.round((calculateTotalAllocation(selectedProjects) / MAX_MONTHLY_CAPACITY) * 100)}% capacity utilization.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Projects List */}
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="space-y-3">
                {selectedProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 font-medium mb-4">No projects allocated</p>
                    <p className="text-sm text-gray-500 mb-4">Click "Add Project" to start allocating</p>
                    <button
                      onClick={() => {
                        setSelectedProjects(prev => [...prev, { 
                          projectName: '', 
                          allocatedDays: 0, 
                          projectId: 0,
                          consumedDays: 0,
                          remainingDays: 0
                        }]);
                      }}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-[#2D5016] hover:text-[#2D5016] hover:bg-green-50 transition-all font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Add Project
                    </button>
                  </div>
                ) : (
                  selectedProjects.map((project, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Project Selector */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Project Name
                            </label>
                            <select
                              value={project.projectName || ''}
                              onChange={(e) => {
                                const selectedProject = allProjects.find(p => p.name === e.target.value);
                                setSelectedProjects(prev => prev.map((proj, i) => 
                                  i === index 
                                    ? { 
                                        ...proj, 
                                        projectName: e.target.value,
                                        projectId: selectedProject?.id || 0
                                      }
                                    : proj
                                ));
                              }}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5016] focus:border-transparent text-sm"
                            >
                              <option value="">Select a project...</option>
                              {allProjects.map((project) => (
                                <option key={project.id} value={project.name}>
                                  {project.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Days Allocation */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Allocated Days
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min="0"
                                max={MAX_MONTHLY_CAPACITY}
                                step="0.5"
                                value={project.allocatedDays || ''}
                                onChange={(e) => {
                                  setSelectedProjects(prev => prev.map((proj, i) => 
                                    i === index 
                                      ? { ...proj, allocatedDays: parseFloat(e.target.value) || 0 }
                                      : proj
                                  ));
                                }}
                                placeholder="0.0"
                                className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5016] focus:border-transparent text-sm font-medium"
                              />
                              <span className="text-sm text-gray-500">days</span>
                              {project.allocatedDays > MAX_MONTHLY_CAPACITY && (
                                <span className="text-xs text-red-600 font-medium">
                                  Exceeds max capacity
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => {
                            setSelectedProjects(selectedProjects.filter((_, i) => i !== index));
                          }}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-red-600 hover:bg-red-50 transition-colors flex-shrink-0 mt-7"
                          title="Remove project"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Project Summary */}
                      {project.projectName && project.allocatedDays > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              <span className="font-medium">{project.projectName}</span> allocation
                            </span>
                            <span className={`font-bold ${
                              project.allocatedDays > MAX_MONTHLY_CAPACITY ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {Math.round(project.allocatedDays)} days
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Add Another Project Button - Only show when projects exist */}
                {selectedProjects.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedProjects(prev => [...prev, { 
                        projectName: '', 
                        allocatedDays: 0, 
                        projectId: 0,
                        consumedDays: 0,
                        remainingDays: 0
                      }]);
                    }}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-[#2D5016] hover:text-[#2D5016] hover:bg-green-50 transition-all font-medium flex items-center justify-center gap-2 mt-4"
                  >
                    <Plus size={20} />
                    Add Another Project
                  </button>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {selectedProjects.filter(p => p.projectName && p.allocatedDays > 0).length}
                </span> project(s) configured
              </div>
              <div className="flex gap-3">
                <button 
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium" 
                  onClick={() => setProjectsOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    calculateTotalAllocation(selectedProjects) > MAX_MONTHLY_CAPACITY
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#2D5016] text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                  }`}
                  onClick={saveProjects}
                  disabled={calculateTotalAllocation(selectedProjects) > MAX_MONTHLY_CAPACITY}
                >
                  Save Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Summary Popup */}
      {projectsSummaryOpen && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <h2 className="text-xl font-bold text-white">Allocation Successful</h2>
              </div>
              <button 
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all" 
                onClick={() => setProjectsSummaryOpen(false)} 
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-semibold text-gray-900">{projectsSummary.employeeName}</span> has been assigned:
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-[#2D5016]">
                    {projectsSummary.projects.length}
                  </span>
                  <span className="text-sm text-gray-600">
                    project{projectsSummary.projects.length !== 1 ? 's' : ''}
                  </span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-2xl font-bold text-[#2D5016]">
                    {Math.round(calculateTotalAllocation(projectsSummary.projects))}
                  </span>
                  <span className="text-sm text-gray-600">days total</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Details:</h3>
                {(projectsSummary.projects || []).map((p, i) => {
                  const projectName = typeof p === 'object' ? p.projectName : p;
                  const days = typeof p === 'object' ? p.allocatedDays : 0;
                  return (
                    <div key={`ps-${i}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-900">{projectName}</span>
                      <span className="text-sm font-bold text-[#2D5016]">{days} days</span>
                    </div>
                  );
                })}
              </div>

              {/* Capacity indicator */}
              <div className="pt-4 border-t border-gray-200">
                {renderAllocationBadge({ projects: projectsSummary.projects })}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button 
                className="px-6 py-2.5 bg-[#2D5016] text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl" 
                onClick={() => setProjectsSummaryOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerEmployees;