import React, { useState, useEffect } from 'react';
import { Eye, Edit, Plus, Trash2, X } from 'lucide-react';
import { getAssets, getEmployees, getAllocations, createAllocation, updateAllocation, deleteAllocation } from '../../lib/api';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';

const display = (val) => (val === undefined || val === null || val === '' ? '-' : val);

const fieldConfigs = {
  basic: [
    { key: 'asset_id', label: 'Asset *', type: 'select', options: [], required: true, placeholder: 'Select Asset' },
    { key: 'employee_id', label: 'Employee *', type: 'select', options: [], required: true, placeholder: 'Select Employee' },
    { key: 'allocation_date', label: 'Allocation Date *', type: 'date', required: true, placeholder: 'YYYY-MM-DD' },
  ],
  additional: [
    { key: 'expected_return_date', label: 'Expected Return Date', type: 'date', placeholder: 'YYYY-MM-DD' },
    { key: 'actual_return_date', label: 'Actual Return Date', type: 'date', placeholder: 'YYYY-MM-DD' },
    { key: 'condition_at_allocation', label: 'Condition at Allocation', type: 'select', options: ['New', 'Good', 'Fair', 'Damaged'], placeholder: 'Select Condition' },
    { key: 'condition_at_return', label: 'Condition at Return', type: 'select', options: ['New', 'Good', 'Fair', 'Damaged'], placeholder: 'Select Condition' },
    { key: 'employee_ack', label: 'Employee Acknowledgment', type: 'checkbox' },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Enter notes' },
  ],
};

const Allocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [viewAllocation, setViewAllocation] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: '',
    employee_id: '',
    allocation_date: '',
    expected_return_date: '',
    actual_return_date: '',
    condition_at_allocation: '',
    condition_at_return: '',
    employee_ack: false,
    notes: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [assetsData, employeesData, allocationsData] = await Promise.all([
          getAssets(),
          getEmployees(),
          getAllocations(),
        ]);
        setAssets(Array.isArray(assetsData) ? assetsData : []);
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
        setAllocations(
          Array.isArray(allocationsData)
            ? allocationsData.filter(a => a.employee_id && !isNaN(a.employee_id))
            : []
        );
      } catch (err) {
        const errorMessage = typeof err === 'string' ? err : err.message || 'Failed to fetch data. Please check if the backend server is running.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset pagination when data changes
  useEffect(() => {
    resetPagination();
  }, [allocations]);

  const resetForm = () => {
    setFormData({
      asset_id: '',
      employee_id: '',
      allocation_date: '',
      expected_return_date: '',
      actual_return_date: '',
      condition_at_allocation: '',
      condition_at_return: '',
      employee_ack: false,
      notes: '',
    });
    setActiveTab('basic');
    setError(null);
  };

  const openAdd = () => {
    resetForm();
    setIsEditing(false);
    setIsAddOpen(true);
  };

  const handleView = (allocation) => {
    setViewAllocation(allocation);
    setIsViewOpen(true);
    setError(null);
  };

  const handleEdit = (allocation) => {
    setFormData({
      asset_id: allocation.asset_id ? String(allocation.asset_id) : '',
      employee_id: allocation.employee_id ? String(allocation.employee_id) : '',
      allocation_date: allocation.allocation_date || '',
      expected_return_date: allocation.expected_return_date || '',
      actual_return_date: allocation.actual_return_date || '',
      condition_at_allocation: allocation.condition_at_allocation || '',
      condition_at_return: allocation.condition_at_return || '',
      employee_ack: !!allocation.employee_ack,
      notes: allocation.notes?.trim() || '',
    });
    setViewAllocation(allocation);
    setIsEditing(true);
    setActiveTab('basic');
    setIsAddOpen(true);
    setError(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      try {
        await deleteAllocation(id);
        setAllocations(prev => prev.filter(a => a.allocation_id !== id));
        setError(null);
      } catch (err) {
        const errorMessage = typeof err === 'string' ? err : err.message || 'Failed to delete allocation';
        setError(errorMessage);
      }
    }
  };

  const onChangeField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: typeof value === 'string' ? value.trim() : value }));
    if (key === 'employee_id') {
      const employeeIdNum = Number(value);
      const employee = employees.find(e => e.employeeId === employeeIdNum);
      if (!employee && value !== '') {
        setError(`Warning: Employee with ID ${value} not found in employee list`);
      } else {
        setError(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredKeys = ['asset_id', 'employee_id', 'allocation_date'];
    for (const key of requiredKeys) {
      if (!formData[key]?.trim()) {
        setError(`Please fill required field: ${fieldConfigs.basic.find(f => f.key === key).label}`);
        return;
      }
    }

    // Validate employee_id
    const employeeIdNum = Number(formData.employee_id);
    if (isNaN(employeeIdNum)) {
      setError('Employee ID must be a valid number');
      return;
    }
    const employee = employees.find(e => e.employeeId === employeeIdNum);
    if (!employee) {
      setError(`Employee with ID ${employeeIdNum} not found`);
      return;
    }

    // Validate date fields
    const dateFields = ['allocation_date', 'expected_return_date', 'actual_return_date'];
    for (const key of dateFields) {
      if (formData[key] && !/^\d{4}-\d{2}-\d{2}$/.test(formData[key])) {
        setError(`${fieldConfigs[key === 'allocation_date' ? 'basic' : 'additional'].find(f => f.key === key).label} must be a valid date (YYYY-MM-DD)`);
        return;
      }
    }

    // Validate conditions
    const conditionFields = ['condition_at_allocation', 'condition_at_return'];
    for (const key of conditionFields) {
      if (formData[key] && !['New', 'Good', 'Fair', 'Damaged'].includes(formData[key])) {
        setError(`${fieldConfigs.additional.find(f => f.key === key).label} must be one of: New, Good, Fair, Damaged`);
        return;
      }
    }

    try {
      const payload = {
        asset_id: Number(formData.asset_id),
        employee_id: Number(formData.employee_id),
        allocation_date: formData.allocation_date,
        expected_return_date: formData.expected_return_date || null,
        actual_return_date: formData.actual_return_date || null,
        condition_at_allocation: formData.condition_at_allocation || null,
        condition_at_return: formData.condition_at_return || null,
        employee_ack: formData.employee_ack,
        notes: formData.notes?.trim() || null,
      };

      if (isEditing && viewAllocation) {
        const updatedAllocation = await updateAllocation(viewAllocation.allocation_id, payload);
        setAllocations(prev =>
          prev.map(a =>
            a.allocation_id === viewAllocation.allocation_id ? updatedAllocation : a
          )
        );
      } else {
        const newAllocation = await createAllocation(payload);
        setAllocations(prev => [newAllocation, ...prev]);
      }

      setIsAddOpen(false);
      setIsEditing(false);
      setViewAllocation(null);
      resetForm();
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'Failed to save allocation. Please check if the backend server is running.';
      setError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsAddOpen(false);
    setIsEditing(false);
    resetForm();
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    setViewAllocation(null);
    setError(null);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Allocation Management</h1>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            disabled={employees.length === 0}
          >
            <Plus className="h-4 w-4" />
            Create Allocation
          </button>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        {loading && <p className="text-gray-500">Loading allocations...</p>}
        {employees.length === 0 && !loading && (
          <p className="text-yellow-500">No employees available. Please add employees to create allocations.</p>
        )}

        {allocations.length === 0 && !loading && (
          <p className="text-gray-500">No allocations found.</p>
        )}

        {allocations.length > 0 && (
          <>
            <div className="flex justify-end mb-2">
              <PageSizeSelect
                pageSize={pageSize}
                onChange={handlePageSizeChange}
                options={[10, 20, 30, 40, 50]}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation Date</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedData(allocations).map((al, index) => (
                      <tr key={al.allocation_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {assets.find(a => a.asset_id === al.asset_id)?.asset_name || 'Unknown Asset'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {employees.find(e => e.employeeId === al.employee_id)?.name || `Unknown Employee (ID: ${al.employee_id})`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(al.allocation_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleView(al)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(al)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(al.allocation_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <PaginationControls
              className="mt-3"
              align="right"
              hideInfo={true}
              hidePageSize={true}
              currentPage={currentPage}
              totalPages={getTotalPages(allocations.length)}
              pageSize={pageSize}
              totalItems={allocations.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}

        {/* Add/Edit Allocation Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">{isEditing ? 'Edit Allocation' : 'Add Allocation'}</h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="flex">
                <div className="w-56 shrink-0 border-r p-4 space-y-2">
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg border ${activeTab === 'basic' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50'}`}
                    onClick={() => setActiveTab('basic')}
                  >
                    Basic Information
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg border ${activeTab === 'additional' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50'}`}
                    onClick={() => setActiveTab('additional')}
                  >
                    Additional Details
                  </button>
                </div>

                <form className="flex-1 p-6" onSubmit={handleSubmit}>
                  {error && <p className="text-red-500 mb-4">{error}</p>}
                  {employees.length === 0 && (
                    <p className="text-red-500 mb-4">No employees available. Please add employees first.</p>
                  )}
                  {activeTab === 'basic' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {fieldConfigs.basic.map(f => (
                          <div key={f.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                            {f.type === 'select' ? (
                              <select
                                value={formData[f.key]}
                                onChange={(e) => onChangeField(f.key, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required={f.required}
                              >
                                <option value="">{f.placeholder}</option>
                                {f.key === 'asset_id'
                                  ? assets.map(a => (
                                      <option key={a.asset_id} value={a.asset_id}>{a.asset_name}</option>
                                    ))
                                  : employees.map(e => (
                                      <option key={e.employeeId} value={e.employeeId}>{e.name}</option>
                                    ))}
                              </select>
                            ) : (
                              <input
                                type={f.type}
                                value={formData[f.key]}
                                onChange={(e) => onChangeField(f.key, e.target.value)}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required={f.required}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'additional' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {fieldConfigs.additional.map(f => (
                          <div key={f.key} className={f.key === 'notes' ? 'col-span-2' : f.key === 'employee_ack' ? 'flex items-center gap-2' : ''}>
                            <label className={`block text-sm font-medium text-gray-700 ${f.key !== 'employee_ack' ? 'mb-1' : ''}`}>
                              {f.label}
                            </label>
                            {f.type === 'select' ? (
                              <select
                                value={formData[f.key]}
                                onChange={(e) => onChangeField(f.key, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">{f.placeholder}</option>
                                {f.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : f.type === 'textarea' ? (
                              <textarea
                                value={formData[f.key]}
                                onChange={(e) => onChangeField(f.key, e.target.value)}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={3}
                              />
                            ) : f.type === 'checkbox' ? (
                              <input
                                id={f.key}
                                type="checkbox"
                                checked={formData[f.key]}
                                onChange={(e) => onChangeField(f.key, e.target.checked)}
                                className="h-4 w-4 border-gray-300 rounded"
                              />
                            ) : (
                              <input
                                type={f.type}
                                value={formData[f.key]}
                                onChange={(e) => onChangeField(f.key, e.target.value)}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                      disabled={employees.length === 0}
                    >
                      {isEditing ? 'Save Changes' : 'Add Allocation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Allocation Modal */}
        {isViewOpen && viewAllocation && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Allocation Details</h2>
                <button onClick={handleCloseView} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Asset</label>
                      <div className="text-gray-900">
                        {assets.find(a => a.asset_id === viewAllocation.asset_id)?.asset_name || 'Unknown Asset'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Employee</label>
                      <div className="text-gray-900">
                        {employees.find(e => e.employeeId === viewAllocation.employee_id)?.name || `Unknown Employee (ID: ${viewAllocation.employee_id})`}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Allocation Date</label>
                      <div className="text-gray-900">{display(viewAllocation.allocation_date)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Expected Return Date</label>
                      <div className="text-gray-900">{display(viewAllocation.expected_return_date)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Actual Return Date</label>
                      <div className="text-gray-900">{display(viewAllocation.actual_return_date)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Condition at Allocation</label>
                      <div className="text-gray-900">{display(viewAllocation.condition_at_allocation)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Condition at Return</label>
                      <div className="text-gray-900">{display(viewAllocation.condition_at_return)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Employee Acknowledgment</label>
                      <div className="text-gray-900">{viewAllocation.employee_ack ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <div className="text-gray-900">{display(viewAllocation.notes)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Allocations;