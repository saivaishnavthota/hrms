import React, { useState, useEffect } from 'react';
import { Eye, Edit, Plus, Trash2, X } from 'lucide-react';
import { getVendors, createVendor, updateVendor, deleteVendor, getVendorById } from '../../lib/api';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';

const vendorTypeOptions = ['Purchased', 'Rental'];

const display = (val) => (val === undefined || val === null || val === '' ? '-' : val);

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [viewVendor, setViewVendor] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
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

  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_type: vendorTypeOptions[0],
    contact_email: '',
    contact_phone: '',
    payment_terms: '',
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  // Reset pagination when data changes
  useEffect(() => {
    resetPagination();
  }, [vendors]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await getVendors();
      setVendors(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_name: '',
      vendor_type: vendorTypeOptions[0],
      contact_email: '',
      contact_phone: '',
      payment_terms: '',
    });
    setActiveTab('basic');
  };

  const openAdd = () => {
    resetForm();
    setIsEditing(false);
    setIsAddOpen(true);
  };

  const handleView = async (vendor) => {
    try {
      const vendorData = await getVendorById(vendor.vendor_id);
      setViewVendor(vendorData);
      setIsViewOpen(true);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch vendor details');
    }
  };

  const handleEdit = (vendor) => {
    setFormData({
      vendor_name: vendor.vendor_name || '',
      vendor_type: vendor.vendor_type || vendorTypeOptions[0],
      contact_email: vendor.contact_email || '',
      contact_phone: vendor.contact_phone || '',
      payment_terms: vendor.payment_terms || '',
    });
    setIsEditing(true);
    setActiveTab('basic');
    setIsAddOpen(true);
    setViewVendor(vendor);
  };

  const onChangeField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendor_name?.trim() || !formData.vendor_type?.trim()) {
      setError('Please fill Vendor Name and Vendor Type');
      return;
    }
    // Optional: Add validation for contact_email and contact_phone
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.contact_phone && !/^\+?\d{7,15}$/.test(formData.contact_phone)) {
      setError('Please enter a valid phone number (7-15 digits, optional +)');
      return;
    }

    try {
      if (isEditing && viewVendor) {
        await updateVendor(viewVendor.vendor_id, formData);
      } else {
        await createVendor(formData);
      }
      setIsAddOpen(false);
      setIsEditing(false);
      setViewVendor(null);
      resetForm();
      fetchVendors();
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to save vendor');
    }
  };

  const handleDelete = async (vendorId) => {
    try {
      await deleteVendor(vendorId);
      fetchVendors();
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to delete vendor');
    }
  };

  const statusBadgeClasses = 'px-2 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Vendor Management</h1>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </button>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        {loading && <p className="text-gray-500">Loading vendors...</p>}

        {Array.isArray(vendors) && vendors.length === 0 && !loading && (
          <p className="text-gray-500">No vendors found.</p>
        )}

        {Array.isArray(vendors) && vendors.length > 0 && (
          <>
            <div className="flex justify-end mb-2">
              <PageSizeSelect
                pageSize={pageSize}
                onChange={handlePageSizeChange}
                options={[10, 20, 30, 40, 50]}
              />
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
                  {getPaginatedData(vendors).map((vendor, index) => (
                    <tr key={vendor.vendor_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{vendor.vendor_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={statusBadgeClasses}>{vendor.vendor_type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(vendor.contact_email)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{display(vendor.contact_phone)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleView(vendor)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.vendor_id)}
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
            <PaginationControls
              className="mt-3"
              align="right"
              hideInfo={true}
              hidePageSize={true}
              currentPage={currentPage}
              totalPages={getTotalPages(vendors.length)}
              pageSize={pageSize}
              totalItems={vendors.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}
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
                      className={`w-full text-left px-3 py-2 rounded-lg border ${
                        activeTab === 'basic' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveTab('basic')}
                    >
                      Basic Information
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg border ${
                        activeTab === 'contact' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50'
                      }`}
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
                            value={formData.vendor_name}
                            onChange={(e) => onChangeField('vendor_name', e.target.value)}
                            placeholder="Enter vendor name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Vendor Type *</label>
                          <select
                            value={formData.vendor_type}
                            onChange={(e) => onChangeField('vendor_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            {vendorTypeOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
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
                            value={formData.contact_email}
                            onChange={(e) => onChangeField('contact_email', e.target.value)}
                            placeholder="Enter email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="text"
                            value={formData.contact_phone}
                            onChange={(e) => onChangeField('contact_phone', e.target.value)}
                            placeholder="Enter phone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                          <input
                            type="text"
                            value={formData.payment_terms}
                            onChange={(e) => onChangeField('payment_terms', e.target.value)}
                            placeholder="Enter payment terms"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsAddOpen(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isEditing ? 'Save Changes' : 'Add Vendor'}
                    </button>
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
              <button
                onClick={() => setIsViewOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor Name</label>
                    <div className="text-gray-900">{display(viewVendor.vendor_name)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor Type</label>
                    <div className="text-gray-900">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {display(viewVendor.vendor_type)}
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
                    <div className="text-gray-900">{display(viewVendor.contact_email)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <div className="text-gray-900">{display(viewVendor.contact_phone)}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                    <div className="text-gray-900">{display(viewVendor.payment_terms)}</div>
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