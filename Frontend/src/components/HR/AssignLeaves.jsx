import React, { useState } from 'react';
import { Eye, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { avatarBg } from '../../lib/avatarColors';
import EditEmployeeModal from './EditEmployeeModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';


const AssignLeaves = () => {
  const [employeeLeaveData, setEmployeeLeaveData] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
const [viewEmployee, setViewEmployee] = useState(null);

  const getAvatarColor = (name) => avatarBg(name);

  React.useEffect(() => {
    const fetchEmployees = async () => {
      setEmployeesError(null);
      setLoadingEmployees(true);
      try {
        const res = await api.get('/users/onboarded-employees');
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const mapped = list.map(e => ({
          id: e.id,
          employee: e.name,
          email: e.email || e.personal_email || '',
          avatar: e.avatar || null,
          type: e.type || 'Full-time',
          role: e.role || 'Employee',
          sickLeave: 0,
          casualLeave: 0,
          annualLeave: 0,
          maternityLeave: 0,
          paternityLeave: 0,
        }));
        setEmployeeLeaveData(mapped);

        await Promise.all(mapped.map(async emp => {
          try {
            const balRes = await api.get(`/leave/leave_balances/${emp.id}`);
            const bal = balRes.data;
            setEmployeeLeaveData(prev => prev.map(e => e.id === emp.id ? {
              ...e,
              sickLeave: bal.sick_leaves ?? e.sickLeave,
              casualLeave: bal.casual_leaves ?? e.casualLeave,
              annualLeave: bal.paid_leaves ?? e.annualLeave,
              maternityLeave: bal.maternity_leave ?? e.maternityLeave,
              paternityLeave: bal.paternity_leave ?? e.paternityLeave,
            } : e));
          } catch { /* ignore 404 */ }
        }));
      } catch (err) {
        console.error(err);
        setEmployeesError('Failed to fetch employees.');
        toast.error('Failed to load employees');
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedEmployees = React.useMemo(() => {
    const list = [...employeeLeaveData];
    if (!sortConfig.key) return list;
    return list.sort((a, b) => {
      const aVal = a[sortConfig.key], bVal = b[sortConfig.key];
      if (typeof aVal === 'string') return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [employeeLeaveData, sortConfig]);

  const renderSortIcon = (key) => sortConfig.key !== key ? <ChevronUp className="w-4 h-4 text-gray-400"/> : (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-gray-600"/> : <ChevronDown className="w-4 h-4 text-gray-600"/>);

  // Actions
  const handleView = (employee) => {
    setViewEmployee(employee);
    setIsViewModalOpen(true);
  };
const handleCloseViewModal = () => {
  setIsViewModalOpen(false);
  setViewEmployee(null);
};

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };
  const handleCloseEdit = () => setIsEditModalOpen(false);

  const handleSaveEmployee = async (updatedEmployee) => {
    try {
      await api.put(`/leave/leave-balance/${updatedEmployee.id}`, {
       sick_leaves: updatedEmployee.sickLeave,
        casual_leaves: updatedEmployee.casualLeave,
        paid_leaves: updatedEmployee.annualLeave,
        maternity_leave: updatedEmployee.maternityLeave,
        paternity_leave: updatedEmployee.paternityLeave,
      });
      setEmployeeLeaveData(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
      toast.success('Employee updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update employee');
    }
    handleCloseEdit();
  };

 const handleDelete = (employee) => {
  if (!window.confirm(`Are you sure you want to remove ${employee.employee} from the list?`)) return;

  setEmployeeLeaveData(prev => prev.filter(e => e.id !== employee.id));
  setSelectedIds(prev => {
    const next = new Set(prev);
    next.delete(employee.id);
    return next;
  });
  toast.success(`${employee.employee} removed from the list`);
};

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const isAllSelected = sortedEmployees.length > 0 && sortedEmployees.every(emp => selectedIds.has(emp.id));
  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedEmployees.map(e => e.id)));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assign Leaves</h1>
        <p className="text-gray-600 mt-1">Manage employee leave balances and assignments</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll}/>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('employee')}>
                <div className="flex items-center gap-1">Employee {renderSortIcon('employee')}</div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type')}>
                <div className="flex items-center gap-1">Type {renderSortIcon('type')}</div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('role')}>
                <div className="flex items-center gap-1">Role {renderSortIcon('role')}</div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('sickLeave')}>
                <div className="flex items-center justify-center gap-1">Sick Leave {renderSortIcon('sickLeave')}</div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('casualLeave')}>
                <div className="flex items-center justify-center gap-1">Casual Leave {renderSortIcon('casualLeave')}</div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('annualLeave')}>
                <div className="flex items-center justify-center gap-1">Annual/Earned Leave {renderSortIcon('annualLeave')}</div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('maternityLeave')}>
                <div className="flex items-center justify-center gap-1">Maternity Leave {renderSortIcon('maternityLeave')}</div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('paternityLeave')}>
                <div className="flex items-center justify-center gap-1">Paternity Leave {renderSortIcon('paternityLeave')}</div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEmployees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <input type="checkbox" checked={selectedIds.has(emp.id)} onChange={() => toggleSelect(emp.id)} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAvatarColor(emp.employee)} flex items-center justify-center`}>
                      <span className="text-sm font-medium text-white">{emp.employee.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex items-center min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">{emp.employee}</span>
                      {emp.email && <span className="text-xs text-gray-500 truncate ml-2">{emp.email}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${emp.type === 'Full-time' ? 'bg-green-100 text-green-800' : emp.type === 'Part-time' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{emp.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{emp.sickLeave}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">{emp.casualLeave}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{emp.annualLeave}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">{emp.maternityLeave}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{emp.paternityLeave}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button onClick={() => handleView(emp)} className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleEdit(emp)} className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1 rounded transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(emp)} className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditEmployeeModal isOpen={isEditModalOpen} onClose={handleCloseEdit} employee={selectedEmployee} onSave={handleSaveEmployee} />
  
  <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
  <DialogContent className="sm:max-w-lg w-full rounded-lg p-6">
    <DialogHeader className="flex flex-col items-center">
      {viewEmployee && (
        <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 ${getAvatarColor(viewEmployee.employee)} text-white text-2xl font-bold`}>
          {viewEmployee.employee.split(' ').map(n => n[0]).join('')}
        </div>
      )}
      <DialogTitle className="text-lg font-semibold text-gray-900">
        Employee Details
      </DialogTitle>
      <DialogClose className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" />
    </DialogHeader>

    {viewEmployee && (
      <DialogDescription className="mt-4 space-y-3 text-sm text-gray-700">
        <div><strong>Name:</strong> {viewEmployee.employee}</div>
        <div><strong>Email:</strong> {viewEmployee.email || '-'}</div>
        <div><strong>Type:</strong> {viewEmployee.type}</div>
        <div><strong>Role:</strong> {viewEmployee.role}</div>

        {/* Leave balances in 2-column grid */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Sick Leave: {viewEmployee.sickLeave}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Casual Leave: {viewEmployee.casualLeave}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Annual Leave: {viewEmployee.annualLeave}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
            Maternity Leave: {viewEmployee.maternityLeave}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Paternity Leave: {viewEmployee.paternityLeave}
          </span>
        </div>
      </DialogDescription>
    )}
  </DialogContent>
</Dialog>


    </div>
  );
};

export default AssignLeaves;
