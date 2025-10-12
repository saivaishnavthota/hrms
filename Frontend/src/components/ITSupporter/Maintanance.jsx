import React, { useState } from 'react';
import { Eye, Edit, Plus, X } from 'lucide-react';

const mockAssets = [
  { id: 1, name: 'Dell Latitude 7420' },
  { id: 2, name: 'HP Z24i Monitor' },
  { id: 3, name: 'Logitech MX Keys' },
];

const mockVendors = [
  { id: 1, name: 'TechCare Solutions' },
  { id: 2, name: 'Global Warranty Inc.' },
  { id: 3, name: 'ProFix Services' },
];

const maintenanceTypes = ['Warranty', 'Repair', 'Service', 'Upgrade'];

const display = (val) => (val === undefined || val === null || val === '' ? '-' : val);

const Maintanance = () => {
  const [maintenances, setMaintenances] = useState([
    { id: 1, asset: mockAssets[0].name, type: 'Warranty', startDate: '2025-10-12', vendor: mockVendors[0].name },
    { id: 2, asset: mockAssets[1].name, type: 'Repair', startDate: '2025-09-20', vendor: mockVendors[1].name },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [viewMaintenance, setViewMaintenance] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [formData, setFormData] = useState({
    assetId: '',
    type: '',
    startDate: '',
    vendorId: '',
    endDate: '',
    cost: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({ assetId: '', type: '', startDate: '', vendorId: '', endDate: '', cost: '', notes: '' });
    setActiveTab('basic');
  };

  const openAdd = () => {
    resetForm();
    setIsEditing(false);
    setIsAddOpen(true);
  };

  const handleView = (m) => {
    setViewMaintenance(m);
    setIsViewOpen(true);
  };

  const handleEdit = (m) => {
    const asset = mockAssets.find(a => a.name === m.asset);
    const vendor = mockVendors.find(v => v.name === m.vendor);
    setFormData({
      assetId: asset?.id || '',
      type: m.type || '',
      startDate: m.startDate || '',
      vendorId: vendor?.id || '',
      endDate: m.endDate || '',
      cost: m.cost || '',
      notes: m.notes || '',
    });
    setViewMaintenance(m);
    setIsEditing(true);
    setActiveTab('basic');
    setIsAddOpen(true);
  };

  const onChangeField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.assetId || !formData.type || !formData.startDate) {
      alert('Please fill Asset, Maintenance Type, and Start Date');
      return;
    }

    const assetName = mockAssets.find(a => a.id === Number(formData.assetId))?.name || '';
    const vendorName = mockVendors.find(v => v.id === Number(formData.vendorId))?.name || '';

    if (isEditing && viewMaintenance) {
      setMaintenances(prev => prev.map(m => (
        m.id === viewMaintenance.id
          ? {
              ...m,
              asset: assetName,
              type: formData.type,
              startDate: formData.startDate,
              vendor: vendorName || m.vendor,
              endDate: formData.endDate,
              cost: formData.cost,
              notes: formData.notes,
            }
          : m
      )));
    } else {
      const newMaintenance = {
        id: maintenances.length ? Math.max(...maintenances.map(m => m.id)) + 1 : 1,
        asset: assetName,
        type: formData.type,
        startDate: formData.startDate,
        vendor: vendorName || '',
        endDate: formData.endDate,
        cost: formData.cost,
        notes: formData.notes,
      };
      setMaintenances(prev => [newMaintenance, ...prev]);
    }

    setIsAddOpen(false);
    setIsEditing(false);
    setViewMaintenance(null);
  };

  return (
     <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance Management</h1>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Plus className="h-4 w-4" />
            Create Maintenance
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {maintenances.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{display(m.asset)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(m.type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(m.startDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleView(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleEdit(m)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
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

      {/* Add/Edit Maintenance Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">{isEditing ? 'Edit Maintenance' : 'Add Maintenance'}</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-56 shrink-0">
                  <div className="space-y-2">
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
                </div>

                {/* Form */}
                <form className="flex-1" onSubmit={handleSubmit}>
                  {activeTab === 'basic' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Asset *</label>
                          <select
                            value={formData.assetId}
                            onChange={(e) => onChangeField('assetId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Asset</option>
                            {mockAssets.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Maintenance Type *</label>
                          <select
                            value={formData.type}
                            onChange={(e) => onChangeField('type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Type</option>
                            {maintenanceTypes.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => onChangeField('startDate', e.target.value)}
                            placeholder="dd-mm-yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'additional' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Vendor (Optional)</label>
                          <select
                            value={formData.vendorId}
                            onChange={(e) => onChangeField('vendorId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Vendor</option>
                            {mockVendors.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => onChangeField('endDate', e.target.value)}
                            placeholder="dd-mm-yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cost (Optional)</label>
                          <input
                            type="number"
                            value={formData.cost}
                            onChange={(e) => onChangeField('cost', e.target.value)}
                            placeholder="Enter cost"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => onChangeField('notes', e.target.value)}
                            placeholder="Enter notes"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{isEditing ? 'Save Changes' : 'Add Maintenance'}</button>
                  </div>
                </form>
              </div>
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
              <button onClick={() => setIsViewOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Asset</label>
                    <div className="text-gray-900">{display(viewMaintenance.asset)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className="text-gray-900">{display(viewMaintenance.type)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <div className="text-gray-900">{display(viewMaintenance.startDate)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor</label>
                    <div className="text-gray-900">{display(viewMaintenance.vendor)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <div className="text-gray-900">{display(viewMaintenance.endDate)}</div>
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
  );
};

export default Maintanance;