import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Edit, Plus, X, Trash2 } from 'lucide-react';
import { avatarBg } from '../../lib/avatarColors';

// Helper to get current user (manager) from localStorage
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

const api = {
  managerEmployees: (managerId) => `http://127.0.0.1:8000/projects/manager-employees?manager_id=${managerId}`,
  allEmployees: 'http://127.0.0.1:8000/users/employees',
  employeeProfile: (empId) => `http://127.0.0.1:8000/users/employee/${empId}`,
  allProjects: 'http://127.0.0.1:8000/projects/get_projects',
  assignProjects: (empId) => `http://127.0.0.1:8000/projects/employees/${empId}/projects`,
  updateEmployee: (empId) => `http://127.0.0.1:8000/users/employees/${empId}`,
};

const cellCls = 'px-4 py-3 border-b border-gray-200 align-top';
const headCls = 'px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-200';
const btnBase = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors';
const btnPrimary = 'px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700';
const btnGhost = 'px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50';
const iconBtn = 'w-9 h-9 inline-flex items-center justify-center rounded-full';
const iconView = 'text-blue-600 hover:bg-blue-100 ';
const iconEdit = 'text-indigo-600 hover:bg-indigo-100 ';
const iconDelete ='text-red-600 hover:bg-red-100';
const tagCls = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'NA';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return (first + last).toUpperCase() || (first.toUpperCase()) || 'NA';
};

const getAvatarColor = (name) => avatarBg(name);

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

  // Edit turns into project editing per requirement; no details editing state

  useEffect(() => {
    if (!managerId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get employees for this manager
        const resMgr = await fetch(api.managerEmployees(managerId));
        const dataMgr = await resMgr.json();
        const mgrEmployees = Array.isArray(dataMgr?.employees) ? dataMgr.employees : (Array.isArray(dataMgr) ? dataMgr : []);

        // Get all employees to enrich type/role if available
        const resAll = await fetch(api.allEmployees);
        const dataAll = await resAll.json();
        const mapType = new Map();
        const allList = Array.isArray(dataAll?.employees) ? dataAll.employees : (Array.isArray(dataAll) ? dataAll : []);
        allList.forEach((e) => {
          const id = e?.employeeId ?? e?.id ?? e?.employeeid;
          if (id != null) {
            mapType.set(Number(id), e?.role || e?.type || e?.employment_type || 'Employee');
          }
        });

        const normalized = mgrEmployees.map((e, idx) => {
          const id = e?.employeeId ?? e?.id ?? e?.employeeid;
          return {
            sNo: idx + 1,
            id: Number(id),
            name: e?.name || e?.employee_name || e?.full_name || '—',
            email: e?.company_email || e?.email || e?.companyEmail || '—',
            type: mapType.get(Number(id)) || 'Employee',
            projects: e?.projects || e?.project_list || [],
            hrList: e?.hr_list || e?.hrs || [],
          };
        });

        setEmployees(normalized);
      } catch (err) {
        setError(err?.message || 'Failed to load manager employees');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [managerId]);

  const openView = async (emp) => {
    setSelectedEmployee(emp);
    setViewOpen(true);
    try {
      const res = await fetch(api.employeeProfile(emp.id));
      const data = await res.json();
      setProfile(data?.employee || data);
    } catch (e) {
      setProfile(null);
    }
  };

  const openEdit = (emp) => {
    // Edit should modify projects, not details
    openProjects(emp);
  };

  // Delete action: clear all projects (unassign) for employee
  const clearProjects = async (emp) => {
    if (!managerId) return;
    const confirmed = window.confirm(`Remove all projects for ${emp.name}?`);
    if (!confirmed) return;
    try {
      const res = await fetch(api.assignProjects(emp.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manager_id: managerId, projects: [] }),
      });
      if (!res.ok) throw new Error('Failed to clear projects');
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, projects: [] } : e)));
    } catch (e) {
      alert(e.message || 'Clear projects failed');
    }
  };

  const openProjects = async (emp) => {
    setSelectedEmployee(emp);
    setSelectedProjects(emp.projects || []);
    setProjectsOpen(true);
    try {
      const res = await fetch(api.allProjects);
      const data = await res.json();
      const names = Array.isArray(data?.projects) ? data.projects.map((p) => p?.project_name || p?.name).filter(Boolean) : (Array.isArray(data) ? data.map((p) => p?.project_name || p?.name).filter(Boolean) : []);
      setAllProjects(names);
    } catch (e) {
      setAllProjects([]);
    }
  };

  const toggleProject = (name) => {
    setSelectedProjects((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const saveProjects = async () => {
    if (!selectedEmployee || !managerId) return;
    try {
      const res = await fetch(api.assignProjects(selectedEmployee.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manager_id: managerId, projects: selectedProjects }),
      });
      if (!res.ok) throw new Error('Failed to assign projects');
      setEmployees((prev) => prev.map((e) => (e.id === selectedEmployee.id ? { ...e, projects: selectedProjects } : e)));
      setProjectsOpen(false);
      setProjectsSummary({ employeeName: selectedEmployee.name, projects: selectedProjects });
      setProjectsSummaryOpen(true);
    } catch (e) {
      alert(e.message || 'Assign projects failed');
    }
  };

  const tableRows = useMemo(() => employees, [employees]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        {/* Removed Add Employee button as requested */}
      </div>

      <div className="mt-4 overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className={headCls}>S.No</th>
              <th className={headCls}>Employee Details</th>
              <th className={headCls}>HRs</th>
              <th className={headCls}>Projects</th>
              <th className={headCls}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className={cellCls} colSpan={5}>Loading…</td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td className={cellCls} colSpan={5}>
                  <div className="text-red-600">{error}</div>
                </td>
              </tr>
            )}
            {!loading && !error && tableRows.length === 0 && (
              <tr>
                <td className={cellCls} colSpan={5}>No employees found for this manager.</td>
              </tr>
            )}
            {!loading && !error && tableRows.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className={cellCls}>{emp.sNo}</td>
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
                  <div className="text-sm text-gray-500 mb-2">
                    {(emp.projects || []).length > 0 ? `${emp.projects.length} project(s) assigned` : 'No projects'}
                  </div>
                 
                </td>
                <td className={cellCls}>
                  <div className="flex items-center gap-3">
                    <button className={`${iconBtn} ${iconView}`} onClick={() => openView(emp)} title="View">
                      <Eye size={16} />
                    </button>
                    <button className={`${iconBtn} ${iconEdit}`} onClick={() => openEdit(emp)} title="Edit Projects">
                      <Edit size={16} />
                    </button>
                    <button className={`${iconBtn} ${iconDelete}`} onClick={() => clearProjects(emp)} title="Delete / Clear Projects">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewOpen && selectedEmployee && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Employee Details</h2>
              <button className="p-1" onClick={() => setViewOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-2">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{selectedEmployee.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{selectedEmployee.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Type</div>
                <div className="font-medium">{selectedEmployee.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Projects</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(selectedEmployee.projects || []).length > 0 ? (
                    selectedEmployee.projects.map((p, i) => <span key={`vp-${i}`} className={tagCls}>{p}</span>)
                  ) : (
                    <span className="text-sm text-gray-500">No projects</span>
                  )}
                </div>
              </div>
              {profile && (
                <div className="mt-2 text-sm text-gray-700">
                  {profile?.phone && <div>Phone: {profile.phone}</div>}
                  {profile?.location && <div>Location: {profile.location}</div>}
                  {profile?.department && <div>Department: {profile.department}</div>}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t flex justify-end">
              <button className={btnGhost} onClick={() => setViewOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal removed: editing projects handled via Projects Modal */}

      {/* Projects Modal */}
      {projectsOpen && selectedEmployee && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Assign Projects</h2>
              <button className="p-1" onClick={() => setProjectsOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-600 mb-2">Select one or more projects for {selectedEmployee.name}:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allProjects.length === 0 && (
                  <div className="text-sm text-gray-500">No projects available</div>
                )}
                {allProjects.map((name) => (
                  <label key={name} className="flex items-center gap-2 border rounded-md px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(name)}
                      onChange={() => toggleProject(name)}
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setProjectsOpen(false)}>Cancel</button>
              <button className={btnPrimary} onClick={saveProjects}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Summary Popup */}
      {projectsSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Projects Assigned</h2>
              <button className="p-1" onClick={() => setProjectsSummaryOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-600">{projectsSummary.employeeName} has been assigned:</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(projectsSummary.projects || []).length > 0 ? (
                  projectsSummary.projects.map((p, i) => <span key={`ps-${i}`} className={tagCls}>{p}</span>)
                ) : (
                  <span className="text-sm text-gray-500">No projects</span>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end">
              <button className={btnPrimary} onClick={() => setProjectsSummaryOpen(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerEmployees;