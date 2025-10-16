import React, { useState, useEffect } from 'react';
import { Eye, Edit, Plus, Trash2, X } from 'lucide-react';
import { getAssets, getVendors, getMaintenanceRecords, createMaintenance, updateMaintenance, deleteMaintenance } from '../../lib/api';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';

const display = (val) => (val === undefined || val === null || val === '' ? '-' : val);

const fieldConfigs = {
  basic: [
    { key: 'asset_id', label: 'Asset *', type: 'select', options: [], required: true, placeholder: 'Select Asset' },
    { key: 'maintenance_type', label: 'Maintenance Type *', type: 'select', options: ['Warranty', 'AMC', 'Repair'], required: true, placeholder: 'Select Type' },
    { key: 'start_date', label: 'Start Date *', type: 'date', required: true, placeholder: 'YYYY-MM-DD' },
  ],
  additional: [
    { key: 'vendor_id', label: 'Vendor (Optional)', type: 'select', options: [], placeholder: 'Select Vendor' },
    { key: 'end_date', label: 'End Date (Optional)', type: 'date', placeholder: 'YYYY-MM-DD' },
    { key: 'cost', label: 'Cost (Optional)', type: 'number', placeholder: 'Enter Cost', min: 0, step: 0.01 },
    { key: 'notes', label: 'Notes (Optional)', type: 'textarea', placeholder: 'Enter notes' },
  ],
};

const Maintenance = () => {
  const [maintenances, setMaintenances] = useState([]);
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [viewMaintenance, setViewMaintenance] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_type: '',
    start_date: '',
    vendor_id: '',
    end_date: '',
    cost: '',
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
        const [assetsData, vendorsData, maintenanceData] = await Promise.all([
          getAssets(),
          getVendors(),
          getMaintenanceRecords(),
        ]);
        console.log('Fetched maintenance records:', maintenanceData);
        console.log('Fetched assets:', assetsData);
        console.log('Fetched vendors:', vendorsData);
        setAssets(Array.isArray(assetsData) ? assetsData : []);
        setVendors(Array.isArray(vendorsData) ? vendorsData : []);
        setMaintenances(Array.isArray(maintenanceData) ? maintenanceData : []);
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
  }, [maintenances]);

  const resetForm = () => {
    setFormData({
      asset_id: '',
      maintenance_type: '',
      start_date: '',
      vendor_id: '',
      end_date: '',
      cost: '',
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

  const handleView = (maintenance) => {
    setViewMaintenance(maintenance);
    setIsViewOpen(true);
    setError(null);
  };

  const handleEdit = (maintenance) => {
    setFormData({
      asset_id: maintenance.asset_id ? String(maintenance.asset_id) : '',
      maintenance_type: maintenance.maintenance_type || '',
      start_date: maintenance.start_date || '',
      vendor_id: maintenance.vendor_id ? String(maintenance.vendor_id) : '',
      end_date: maintenance.end_date || '',
      cost: maintenance.cost ? String(maintenance.cost) : '',
      notes: maintenance.notes?.trim() || '',
    });
    setViewMaintenance(maintenance);
    setIsEditing(true);
    setActiveTab('basic');
    setIsAddOpen(true);
    setError(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await deleteMaintenance(id);
        setMaintenances(prev => prev.filter(m => m.maintenance_id !== id));
        setError(null);
      } catch (err) {
        const errorMessage = typeof err === 'string' ? err : err.message || 'Failed to delete maintenance record';
        setError(errorMessage);
      }
    }
  };

  const onChangeField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: typeof value === 'string' ? value.trim() : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredKeys = ['asset_id', 'maintenance_type', 'start_date'];
    for (const key of requiredKeys) {
      if (!formData[key]?.trim()) {
        setError(`Please fill required field: ${fieldConfigs.basic.find(f => f.key === key).label}`);
        return;
      }
    }

    // Validate date fields
    const dateFields = ['start_date', 'end_date'];
    for (const key of dateFields) {
      if (formData[key] && !/^\d{4}-\d{2}-\d{2}$/.test(formData[key])) {
        setError(`${fieldConfigs[key === 'start_date' ? 'basic' : 'additional'].find(f => f.key === key).label} must be a valid date (YYYY-MM-DD)`);
        return;
      }
    }

    // Validate cost
    if (formData.cost && (isNaN(formData.cost) || Number(formData.cost) < 0)) {
      setError('Cost must be a valid non-negative number');
      return;
    }

    try {
      const payload = {
        asset_id: Number(formData.asset_id),
        maintenance_type: formData.maintenance_type,
        start_date: formData.start_date,
        vendor_id: formData.vendor_id ? Number(formData.vendor_id) : null,
        end_date: formData.end_date || null,
        cost: formData.cost ? Number(formData.cost) : null,
        notes: formData.notes?.trim() || null,
      };

      if (isEditing && viewMaintenance) {
        const updatedMaintenance = await updateMaintenance(viewMaintenance.maintenance_id, payload);
        setMaintenances(prev =>
          prev.map(m =>
            m.maintenance_id === viewMaintenance.maintenance_id ? updatedMaintenance : m
          )
        );
      } else {
        const newMaintenance = await createMaintenance(payload);
        setMaintenances(prev => [newMaintenance, ...prev]);
      }

      setIsAddOpen(false);
      setIsEditing(false);
      setViewMaintenance(null);
      resetForm();
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'Failed to save maintenance record. Please check if the backend server is running.';
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
    setViewMaintenance(null);
    setError(null);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance Management</h1>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Create Maintenance
          </button>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        {loading && <p className="text-gray-500">Loading maintenance records...</p>}

        {maintenances.length === 0 && !loading && (
          <p className="text-gray-500">No maintenance records found.</p>
        )}

        {maintenances.length > 0 && (
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedData(maintenances).map((m, index) => (
                      <tr key={m.maintenance_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {assets.find(a => a.asset_id === m.asset_id)?.asset_name || 'Unknown Asset'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(m.maintenance_type)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(m.start_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleView(m)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(m)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.maintenance_id)}
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
              totalPages={getTotalPages(maintenances.length)}
              pageSize={pageSize}
              totalItems={maintenances.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}

        {/* Add/Edit Maintenance Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">{isEditing ? 'Edit Maintenance' : 'Add Maintenance'}</h2>
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
                                  : f.options.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
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
                          <div key={f.key} className={f.key === 'notes' ? 'col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                            {f.type === 'select' ? (
                              <select
                                value={formData[f.key]}
                                onChange={(e) => onChangeField(f.key, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">{f.placeholder}</option>
                                {f.key === 'vendor_id'
                                  ? vendors.map(v => (
                                      <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>
                                    ))
                                  : f.options?.map(opt => (
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
                            ) : (
                              <input
                                type={f.type}
                                value={formData[f.key]}
                                onChange={(e) => onChangeField(f.key, e.target.value)}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                min={f.min}
                                step={f.step}
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
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isEditing ? 'Save Changes' : 'Add Maintenance'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Maintenance Modal */}
        {isViewOpen && viewMaintenance && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Maintenance Details</h2>
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
                        {assets.find(a => a.asset_id === viewMaintenance.asset_id)?.asset_name || 'Unknown Asset'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <div className="text-gray-900">{display(viewMaintenance.maintenance_type)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Start Date</label>
                      <div className="text-gray-900">{display(viewMaintenance.start_date)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vendor</label>
                      <div className="text-gray-900">
                        {viewMaintenance.vendor_id ? vendors.find(v => v.vendor_id === viewMaintenance.vendor_id)?.vendor_name || 'Unknown Vendor' : 'No Vendor Assigned'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">End Date</label>
                      <div className="text-gray-900">{display(viewMaintenance.end_date)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Cost</label>
                      <div className="text-gray-900">{display(viewMaintenance.cost)}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <div className="text-gray-900">{display(viewMaintenance.notes)}</div>
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

export default Maintenance;