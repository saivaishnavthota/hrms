import React, { useState } from 'react';
import { Eye, Edit, Plus, X } from 'lucide-react';

const mockEmployees = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Developer', phone: '+1-555-0101' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Designer', phone: '+1-555-0102' },
  { id: 3, name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Support', phone: '+1-555-0103' },
];

const display = (val) => (val === undefined || val === null || val === '' ? '-' : val);

const ITEmployees = () => {
  const [employees, setEmployees] = useState(mockEmployees);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [viewEmployee, setViewEmployee] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', role: '' });
    setActiveTab('basic');
  };

  const openAdd = () => {
    resetForm();
    setIsEditing(false);
    setIsAddOpen(true);
  };

  const handleView = (employee) => {
    setViewEmployee(employee);
    setIsViewOpen(true);
  };

  const handleEdit = (employee) => {
    setFormData({
      name: employee.name || '',
      email: employee.email || '',
      role: employee.role || '',
      
    });
    setViewEmployee(employee);
    setIsEditing(true);
    setActiveTab('basic');
    setIsAddOpen(true);
  };

  const onChangeField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.role?.trim()) {
      alert('Please fill Name, Email, and Role');
      return;
    }

    if (isEditing && viewEmployee) {
      setEmployees((prev) => prev.map((emp) => (emp.id === viewEmployee.id ? { ...emp, ...formData } : emp)));
    } else {
      const newEmployee = {
        id: employees.length ? Math.max(...employees.map((e) => e.id)) + 1 : 1,
        ...formData,
      };
      setEmployees((prev) => [newEmployee, ...prev]);
    }

    setIsAddOpen(false);
    setIsEditing(false);
    setViewEmployee(null);
  };

  return (
     <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Plus className="h-4 w-4" />
            Create Employee
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
             
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((emp, index) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{emp.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(emp.email)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700">{display(emp.role)}</span>
                  </td>
                 
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleView(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleEdit(emp)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">{isEditing ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-48 shrink-0">
                  <div className="space-y-2">
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg border ${activeTab === 'basic' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('basic')}
                    >
                      Basic Information
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form className="flex-1" onSubmit={handleSubmit}>
                  {activeTab === 'basic' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => onChangeField('name', e.target.value)}
                            placeholder="Enter name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email *</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => onChangeField('email', e.target.value)}
                            placeholder="Enter email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role *</label>
                          <input
                            type="text"
                            value={formData.role}
                            onChange={(e) => onChangeField('role', e.target.value)}
                            placeholder="Enter role"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                       
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{isEditing ? 'Save Changes' : 'Add Employee'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {isViewOpen && viewEmployee && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Employee Details</h2>
              <button onClick={() => setIsViewOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <div className="text-gray-900">{display(viewEmployee.name)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="text-gray-900">{display(viewEmployee.email)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Role</label>
                    <div className="text-gray-900"><span className="px-2 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700">{display(viewEmployee.role)}</span></div>
                  </div>
                 
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITEmployees;