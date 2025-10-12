import React, { useState } from 'react';
import { Eye, Edit, Plus, X } from 'lucide-react';

const mockAssets = [
  { id: 1, name: 'Dell Latitude 7420' },
  { id: 2, name: 'HP Z24i Monitor' },
  { id: 3, name: 'Logitech MX Keys' },
];

const mockEmployees = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Alice Johnson' },
];

const display = (val) => (val === undefined || val === null || val === '' ? '-' : val);

const Allocations = () => {
  const [allocations, setAllocations] = useState([
    { id: 1, asset: mockAssets[0].name, employee: mockEmployees[0].name, allocationDate: '2025-10-12' },
    { id: 2, asset: mockAssets[1].name, employee: mockEmployees[1].name, allocationDate: '2025-10-01' },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [viewAllocation, setViewAllocation] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [formData, setFormData] = useState({
    assetId: '',
    employeeId: '',
    allocationDate: '',
    expectedReturnDate: '',
    actualReturnDate: '',
    conditionAtAllocation: '',
    conditionAtReturn: '',
    acknowledgment: false,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      assetId: '',
      employeeId: '',
      allocationDate: '',
      expectedReturnDate: '',
      actualReturnDate: '',
      conditionAtAllocation: '',
      conditionAtReturn: '',
      acknowledgment: false,
      notes: '',
    });
    setActiveTab('basic');
  };

  const openAdd = () => {
    resetForm();
    setIsEditing(false);
    setIsAddOpen(true);
  };

  const handleView = (allocation) => {
    setViewAllocation(allocation);
    setIsViewOpen(true);
  };

  const handleEdit = (allocation) => {
    const asset = mockAssets.find(a => a.name === allocation.asset);
    const employee = mockEmployees.find(e => e.name === allocation.employee);
    setFormData({
      assetId: asset?.id || '',
      employeeId: employee?.id || '',
      allocationDate: allocation.allocationDate || '',
      expectedReturnDate: allocation.expectedReturnDate || '',
      actualReturnDate: allocation.actualReturnDate || '',
      conditionAtAllocation: allocation.conditionAtAllocation || '',
      conditionAtReturn: allocation.conditionAtReturn || '',
      acknowledgment: !!allocation.acknowledgment,
      notes: allocation.notes || '',
    });
    setViewAllocation(allocation);
    setIsEditing(true);
    setActiveTab('basic');
    setIsAddOpen(true);
  };

  const onChangeField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.assetId || !formData.employeeId || !formData.allocationDate) {
      alert('Please fill Asset, Employee, and Allocation Date');
      return;
    }

    const assetName = mockAssets.find(a => a.id === Number(formData.assetId))?.name || '';
    const employeeName = mockEmployees.find(e => e.id === Number(formData.employeeId))?.name || '';

    if (isEditing && viewAllocation) {
      setAllocations(prev => prev.map(a => (
        a.id === viewAllocation.id
          ? {
              ...a,
              asset: assetName,
              employee: employeeName,
              allocationDate: formData.allocationDate,
              expectedReturnDate: formData.expectedReturnDate,
              actualReturnDate: formData.actualReturnDate,
              conditionAtAllocation: formData.conditionAtAllocation,
              conditionAtReturn: formData.conditionAtReturn,
              acknowledgment: formData.acknowledgment,
              notes: formData.notes,
            }
          : a
      )));
    } else {
      const newAllocation = {
        id: allocations.length ? Math.max(...allocations.map(a => a.id)) + 1 : 1,
        asset: assetName,
        employee: employeeName,
        allocationDate: formData.allocationDate,
        expectedReturnDate: formData.expectedReturnDate,
        actualReturnDate: formData.actualReturnDate,
        conditionAtAllocation: formData.conditionAtAllocation,
        conditionAtReturn: formData.conditionAtReturn,
        acknowledgment: formData.acknowledgment,
        notes: formData.notes,
      };
      setAllocations(prev => [newAllocation, ...prev]);
    }

    setIsAddOpen(false);
    setIsEditing(false);
    setViewAllocation(null);
  };

  return (
     <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Allocation Management</h1>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Plus className="h-4 w-4" />
            Create Allocation
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allocations.map((al) => (
                <tr key={al.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{display(al.asset)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(al.employee)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(al.allocationDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleView(al)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleEdit(al)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
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

      {/* Add/Edit Allocation Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">{isEditing ? 'Edit Allocation' : 'Add Allocation'}</h2>
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
                          <label className="block text-sm font-medium text-gray-700">Employee *</label>
                          <select
                            value={formData.employeeId}
                            onChange={(e) => onChangeField('employeeId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Employee</option>
                            {mockEmployees.map(e => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Allocation Date *</label>
                          <input
                            type="date"
                            value={formData.allocationDate}
                            onChange={(e) => onChangeField('allocationDate', e.target.value)}
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
                          <label className="block text-sm font-medium text-gray-700">Expected Return Date</label>
                          <input
                            type="date"
                            value={formData.expectedReturnDate}
                            onChange={(e) => onChangeField('expectedReturnDate', e.target.value)}
                            placeholder="dd-mm-yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Actual Return Date</label>
                          <input
                            type="date"
                            value={formData.actualReturnDate}
                            onChange={(e) => onChangeField('actualReturnDate', e.target.value)}
                            placeholder="dd-mm-yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Condition at Allocation</label>
                          <select
                            value={formData.conditionAtAllocation}
                            onChange={(e) => onChangeField('conditionAtAllocation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Condition</option>
                            {['New', 'Good', 'Used', 'Refurbished'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Condition at Return</label>
                          <select
                            value={formData.conditionAtReturn}
                            onChange={(e) => onChangeField('conditionAtReturn', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Condition</option>
                            {['New', 'Good', 'Used', 'Refurbished'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            id="ack"
                            type="checkbox"
                            checked={formData.acknowledgment}
                            onChange={(e) => onChangeField('acknowledgment', e.target.checked)}
                            className="h-4 w-4 border-gray-300 rounded"
                          />
                          <label htmlFor="ack" className="text-sm font-medium text-gray-700">Employee Acknowledgment</label>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Notes</label>
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
                    <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{isEditing ? 'Save Changes' : 'Add Allocation'}</button>
                  </div>
                </form>
              </div>
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
                    <div className="text-gray-900">{display(viewAllocation.asset)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Employee</label>
                    <div className="text-gray-900">{display(viewAllocation.employee)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Allocation Date</label>
                    <div className="text-gray-900">{display(viewAllocation.allocationDate)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Expected Return Date</label>
                    <div className="text-gray-900">{display(viewAllocation.expectedReturnDate)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Actual Return Date</label>
                    <div className="text-gray-900">{display(viewAllocation.actualReturnDate)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Condition at Allocation</label>
                    <div className="text-gray-900">{display(viewAllocation.conditionAtAllocation)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Condition at Return</label>
                    <div className="text-gray-900">{display(viewAllocation.conditionAtReturn)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Employee Acknowledgment</label>
                    <div className="text-gray-900">{viewAllocation.acknowledgment ? 'Yes' : 'No'}</div>
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
  );
};

export default Allocations;