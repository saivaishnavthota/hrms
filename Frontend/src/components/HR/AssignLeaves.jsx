import React, { useState } from 'react';
import { Eye, Edit, Trash2, ChevronUp, ChevronDown, UserCircle } from 'lucide-react';
import EditEmployeeModal from './EditEmployeeModal';
import axios from 'axios';
import { toast } from 'react-toastify';
import { avatarBg } from '../../lib/avatarColors';

const AssignLeaves = () => {
  // Employees fetched from backend
  const [employeeLeaveData, setEmployeeLeaveData] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Sample data with employee leave balance
  const getAvatarColor = (name) => avatarBg(name);

  // Fetch onboarded employees from backend and map to local structure
  React.useEffect(() => {
    const fetchEmployees = async () => {
      setEmployeesError(null);
      setLoadingEmployees(true);
      try {
        const res = await axios.get('http://127.0.0.1:8000/users/onboarded-employees');
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const mapped = list.map((e) => ({
          id: e.id,
          employee: e.name,
          email: e.email || e.personal_email || '',
          avatar: e.avatar || null,
          type: e.type || 'Full-time',
          role: e.role || 'Employee',
          // Leave balances will be fetched/assigned separately. Default to 0.
          sickLeave: 0,
          casualLeave: 0,
          annualLeave: 0,
          maternityLeave: 0,
          paternityLeave: 0,
        }));
        setEmployeeLeaveData(mapped);
        // toast.success(`Loaded ${mapped.length} employees`);

        // Fetch existing leave balances per employee and populate
        const fetchBalances = async () => {
          let failedCount = 0;
          const results = await Promise.allSettled(
            mapped.map(async (emp) => {
              try {
                const balRes = await axios.get(`http://127.0.0.1:8000/leave/leave_balances/${emp.id}`);
                const bal = balRes.data;
                setEmployeeLeaveData((prev) => prev.map((e) => (
                  e.id === emp.id
                    ? {
                        ...e,
                        sickLeave: bal.sick_leaves ?? e.sickLeave,
                        casualLeave: bal.casual_leaves ?? e.casualLeave,
                        annualLeave: bal.paid_leaves ?? e.annualLeave,
                        maternityLeave: bal.maternity_leave ?? e.maternityLeave,
                        paternityLeave: bal.paternity_leave ?? e.paternityLeave,
                      }
                    : e
                )));
              } catch (err) {
                // If not found (404), skip; balances remain defaults
                const status = err?.response?.status;
                if (status !== 404) {
                  console.warn(`Failed to fetch balance for employee ${emp.id}:`, err);
                  failedCount += 1;
                }
              }
            })
          );
          const succeeded = results.filter(r => r.status === 'fulfilled').length;
          if (failedCount > 0) {
            toast.warn(`Updated ${succeeded} balances; ${failedCount} failed`);
          }  //else if (mapped.length > 0) {
          //   toast.success('Leave balances updated');
          // }
        };
        fetchBalances();
      } catch (err) {
        console.error('Failed to fetch onboarded employees:', err);
        setEmployeesError('Failed to fetch employees. Please ensure backend is running.');
        toast.error('Failed to load employees');
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleView = (employee) => {
    console.log('View employee:', employee);
    // TODO: Implement view functionality
  };

  const handleSaveEmployee = (updatedEmployee) => {
    // Update the employee data in the state
    setEmployeeLeaveData(prevEmployees => 
      prevEmployees.map(emp => 
        emp.id === updatedEmployee.id ? updatedEmployee : emp
      )
    );
    console.log('Employee updated:', updatedEmployee);
    // TODO: Implement API call to save changes
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleDelete = (employee) => {
    console.log('Delete employee:', employee);
    // TODO: Implement delete functionality
  };

  const sortedEmployees = React.useMemo(() => {
    let sortableEmployees = [...employeeLeaveData];
    if (!sortConfig.key) return sortableEmployees;

    return sortableEmployees.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc' 
        ? aValue - bValue 
        : bValue - aValue;
    });
  }, [employeeLeaveData, sortConfig]);

  const getSortedData = () => {
    return sortedEmployees;
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-gray-600" />
      : <ChevronDown className="w-4 h-4 text-gray-600" />;
  };

  const sortedData = getSortedData();

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllSelected = sortedData.length > 0 && sortedData.every(emp => selectedIds.has(emp.id));
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (isAllSelected) return new Set();
      const next = new Set();
      sortedData.forEach(emp => next.add(emp.id));
      return next;
    });
  };

  const assignDefaultLeaves = async () => {
    setActionMessage(null);
    setActionError(null);
    if (selectedIds.size === 0) {
      setActionError('Please select at least one employee.');
      toast.info('Please select at least one employee');
      return;
    }
    setActionLoading(true);
    const DEFAULTS = {
      sick_leaves: 6,
      casual_leaves: 6,
      paid_leaves: 15,
      maternity_leave: 0,
      paternity_leave: 0,
    };

    try {
      const ids = Array.from(selectedIds);
      let failed = 0;
      for (const id of ids) {
        try {
          await axios.post(`http://127.0.0.1:8000/leave/init/${id}`);
        } catch (err) {
          const status = err?.response?.status;
          // If already exists (likely 400), continue to update
          if (status !== 400 && status !== 409) {
            failed += 1;
            console.warn('Init failed for employee', id, err);
            continue;
          }
        }
        try {
          await axios.put(`http://127.0.0.1:8000/leave/leave-balance/${id}`, DEFAULTS);
        } catch (err) {
          failed += 1;
          console.error('Update balance failed for employee', id, err);
          continue;
        }

        // Refetch balance from backend to restore UI from source of truth
        try {
          const balRes = await axios.get(`http://127.0.0.1:8000/leave/leave_balances/${id}`);
          const bal = balRes.data;
          setEmployeeLeaveData(prev => prev.map(emp => (
            emp.id === id
              ? {
                  ...emp,
                  sickLeave: bal.sick_leaves ?? DEFAULTS.sick_leaves,
                  casualLeave: bal.casual_leaves ?? DEFAULTS.casual_leaves,
                  annualLeave: bal.paid_leaves ?? DEFAULTS.paid_leaves,
                  maternityLeave: bal.maternity_leave ?? DEFAULTS.maternity_leave,
                  paternityLeave: bal.paternity_leave ?? DEFAULTS.paternity_leave,
                }
              : emp
          )));
        } catch (err) {
          console.warn(`Failed to refetch balance for employee ${id}, falling back to defaults`, err);
          setEmployeeLeaveData(prev => prev.map(emp => (
            emp.id === id
              ? {
                  ...emp,
                  sickLeave: DEFAULTS.sick_leaves,
                  casualLeave: DEFAULTS.casual_leaves,
                  annualLeave: DEFAULTS.paid_leaves,
                  maternityLeave: DEFAULTS.maternity_leave,
                  paternityLeave: DEFAULTS.paternity_leave,
                }
              : emp
          )));
        }
      }
      const successCount = ids.length - failed;
      if (successCount > 0 && failed === 0) {
        toast.success(`Assigned default leaves to ${successCount} employee(s)`);
        setActionMessage(`Assigned default leaves to ${successCount} employee(s).`);
      } else if (successCount > 0 && failed > 0) {
        toast.warn(`Assigned ${successCount}, ${failed} failed`);
        setActionMessage(`Assigned ${successCount}, ${failed} failed.`);
      } else {
        toast.error('Failed to assign default leaves');
        setActionError('Failed to assign default leaves. Please try again.');
      }
    } catch (err) {
      console.error('Failed assigning default leaves:', err);
      setActionError('Failed to assign default leaves. Please try again.');
      toast.error('Failed to assign default leaves');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assign Leaves</h1>
        <p className="text-gray-600 mt-1">Manage employee leave balances and assignments</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={assignDefaultLeaves}
              disabled={selectedIds.size === 0 || actionLoading || loadingEmployees}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${selectedIds.size === 0 || actionLoading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Assign Default Leaves (6/6/15)
            </button>
            {actionLoading && (
              <span className="text-sm text-gray-600">Applying...</span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Selected: {selectedIds.size}
          </div>
        </div>

        {/* Employees loading/error state */}
        {loadingEmployees && (
          <div className="px-4 py-2 bg-gray-50 text-gray-700 border-b border-gray-200">Loading employees...</div>
        )}
        {employeesError && (
          <div className="px-4 py-2 bg-red-50 text-red-700 border-b border-red-200">{employeesError}</div>
        )}

        {(actionMessage || actionError) && (
          <div className={`px-4 py-2 ${actionError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {actionError || actionMessage}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('employee')}
                >
                  <div className="flex items-center gap-1">
                    Employee
                    {renderSortIcon('employee')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {renderSortIcon('type')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Role
                    {renderSortIcon('role')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sickLeave')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Sick Leave
                    {renderSortIcon('sickLeave')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('casualLeave')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Casual Leave
                    {renderSortIcon('casualLeave')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('annualLeave')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Annual/Earned Leave
                    {renderSortIcon('annualLeave')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('maternityLeave')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Maternity Leave
                    {renderSortIcon('maternityLeave')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('paternityLeave')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Paternity Leave
                    {renderSortIcon('paternityLeave')}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((employee, index) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(employee.id)}
                      onChange={() => toggleSelect(employee.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                     <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAvatarColor(employee.employee)} flex items-center justify-center`}>
                        <span className="text-sm font-medium text-white">
                          {employee.employee.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex items-center min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {employee.employee}
                        </span>
                        {employee.email && (
                          <span className="text-xs text-gray-500 truncate ml-2">
                            {employee.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.type === 'Full-time' 
                        ? 'bg-green-100 text-green-800'
                        : employee.type === 'Part-time'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {employee.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {employee.sickLeave}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {employee.casualLeave}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {employee.annualLeave}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                      {employee.maternityLeave}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {employee.paternityLeave}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleView(employee)}
                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee)}
                        className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination placeholder */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedData.length}</span> of{' '}
                  <span className="font-medium">{sortedData.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        employee={selectedEmployee}
        onSave={handleSaveEmployee}
      />
    </div>
  );
};

export default AssignLeaves;