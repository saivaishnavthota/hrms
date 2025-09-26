import React, { useState } from 'react';
import { Eye, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import EditEmployeeModal from './EditEmployeeModal';

const AssignLeaves = () => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Sample data with employee leave balances
  const [employeeLeaveData, setEmployeeLeaveData] = useState([
    {
      id: 1,
      employee: 'Dr. Sarah Johnson',
      type: 'Full-time',
      role: 'Senior Doctor',
      sickLeave: 12,
      casualLeave: 15,
      annualLeave: 25,
      maternityLeave: 90,
      paternityLeave: 15
    },
    {
      id: 2,
      employee: 'Mr. John Smith',
      type: 'Full-time',
      role: 'Nurse',
      sickLeave: 10,
      casualLeave: 12,
      annualLeave: 20,
      maternityLeave: 0,
      paternityLeave: 10
    },
    {
      id: 3,
      employee: 'Ms. Emily Davis',
      type: 'Part-time',
      role: 'Receptionist',
      sickLeave: 8,
      casualLeave: 10,
      annualLeave: 15,
      maternityLeave: 60,
      paternityLeave: 0
    },
    {
      id: 4,
      employee: 'Dr. Michael Brown',
      type: 'Full-time',
      role: 'Specialist',
      sickLeave: 15,
      casualLeave: 18,
      annualLeave: 30,
      maternityLeave: 0,
      paternityLeave: 20
    },
    {
      id: 5,
      employee: 'Ms. Lisa Wilson',
      type: 'Full-time',
      role: 'Administrator',
      sickLeave: 12,
      casualLeave: 15,
      annualLeave: 22,
      maternityLeave: 120,
      paternityLeave: 0
    },
    {
      id: 6,
      employee: 'Mr. David Garcia',
      type: 'Contract',
      role: 'Technician',
      sickLeave: 6,
      casualLeave: 8,
      annualLeave: 12,
      maternityLeave: 0,
      paternityLeave: 15
    }
  ]);

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assign Leaves</h1>
        <p className="text-gray-600 mt-1">Manage employee leave balances and assignments</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
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
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.employee}
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