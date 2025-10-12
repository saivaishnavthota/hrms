import React, { useState } from 'react';
import { Eye, Edit, Plus, X } from 'lucide-react';

const mockVendors = [
  { id: 1, name: 'Dell Technologies', type: 'Purchased', email: 'support@dell.com', phone: '+1-800-123-4567', paymentTerms: 'Net 30' },
  { id: 2, name: 'HP Inc.', type: 'Purchased', email: 'care@hp.com', phone: '+1-800-987-6543', paymentTerms: 'Net 45' },
  { id: 3, name: 'Microsoft', type: 'Software', email: 'licensing@microsoft.com', phone: '+1-425-555-0100', paymentTerms: 'Annual' },
  { id: 4, name: 'Logitech', type: 'Peripheral', email: 'sales@logitech.com', phone: '+1-800-765-4321', paymentTerms: 'Net 30' },
];

const vendorTypeOptions = ['Purchased', 'Rental', 'Service', 'Software', 'Peripheral'];

const display = (val) => (val === undefined || val === null || val === '' ? '-' : val);

const Vendors = () => {
  const [vendors, setVendors] = useState(mockVendors);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [viewVendor, setViewVendor] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [formData, setFormData] = useState({
    vendorName: '',
    vendorType: vendorTypeOptions[0],
    email: '',
    phone: '',
    paymentTerms: '',
  });

  const resetForm = () => {
    setFormData({ vendorName: '', vendorType: vendorTypeOptions[0], email: '', phone: '', paymentTerms: '' });
    setActiveTab('basic');
  };

  const openAdd = () => {
    resetForm();
    setIsEditing(false);
    setIsAddOpen(true);
  };

  const handleView = (vendor) => {
    setViewVendor(vendor);
    setIsViewOpen(true);
  };

  const handleEdit = (vendor) => {
    setFormData({
      vendorName: vendor.name || '',
      vendorType: vendor.type || vendorTypeOptions[0],
      email: vendor.email || '',
      phone: vendor.phone || '',
      paymentTerms: vendor.paymentTerms || '',
    });
    setIsEditing(true);
    setActiveTab('basic');
    setIsAddOpen(true);
  };

  const onChangeField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.vendorName?.trim() || !formData.vendorType?.trim()) {
      alert('Please fill Vendor Name and Vendor Type');
      return;
    }

    if (isEditing && viewVendor) {
      setVendors((prev) => prev.map((v) => (v.id === viewVendor.id ? {
        ...v,
        name: formData.vendorName,
        type: formData.vendorType,
        email: formData.email,
        phone: formData.phone,
        paymentTerms: formData.paymentTerms,
      } : v)));
    } else {
      const newVendor = {
        id: vendors.length ? Math.max(...vendors.map((v) => v.id)) + 1 : 1,
        name: formData.vendorName,
        type: formData.vendorType,
        email: formData.email,
        phone: formData.phone,
        paymentTerms: formData.paymentTerms,
      };
      setVendors((prev) => [newVendor, ...prev]);
    }

    setIsAddOpen(false);
    setIsEditing(false);
    setViewVendor(null);
  };

  const statusBadgeClasses = 'px-2 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700';

  return (
     <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Vendor Management</h1>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Plus className="h-4 w-4" />
            Add Vendor
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor, index) => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{vendor.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={statusBadgeClasses}>{vendor.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(vendor.email)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(vendor.phone)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleView(vendor)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleEdit(vendor)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
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

      {/* Add/Edit Vendor Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">{isEditing ? 'Edit Vendor' : 'Add Vendor'}</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-6">
                <div className="w-48 shrink-0">
                  <div className="space-y-2">
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg border ${activeTab === 'basic' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('basic')}
                    >
                      Basic Information
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg border ${activeTab === 'contact' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('contact')}
                    >
                      Contact Details
                    </button>
                  </div>
                </div>

                <form className="flex-1" onSubmit={handleSubmit}>
                  {activeTab === 'basic' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Vendor Name *</label>
                          <input
                            type="text"
                            value={formData.vendorName}
                            onChange={(e) => onChangeField('vendorName', e.target.value)}
                            placeholder="Enter vendor name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Vendor Type *</label>
                          <select
                            value={formData.vendorType}
                            onChange={(e) => onChangeField('vendorType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            {vendorTypeOptions.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'contact' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => onChangeField('email', e.target.value)}
                            placeholder="Enter email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => onChangeField('phone', e.target.value)}
                            placeholder="Enter phone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                          <input
                            type="text"
                            value={formData.paymentTerms}
                            onChange={(e) => onChangeField('paymentTerms', e.target.value)}
                            placeholder="Enter payment terms"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{isEditing ? 'Save Changes' : 'Add Vendor'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Vendor Modal */}
      {isViewOpen && viewVendor && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Vendor Details</h2>
              <button onClick={() => setIsViewOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor Name</label>
                    <div className="text-gray-900">{display(viewVendor.name)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor Type</label>
                    <div className="text-gray-900">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {display(viewVendor.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="text-gray-900">{display(viewVendor.email)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <div className="text-gray-900">{display(viewVendor.phone)}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                    <div className="text-gray-900">{display(viewVendor.paymentTerms)}</div>
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

export default Vendors;