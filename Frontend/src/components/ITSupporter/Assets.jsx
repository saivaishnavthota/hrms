import React, { useState, useEffect } from 'react';
import { Eye, Edit, Plus, Trash2, X } from 'lucide-react';
import { getAssets, getAssetById, createAsset, updateAsset, deleteAsset, getVendors } from '../../lib/api';

const statusBadgeClasses = (status) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Inactive':
      return 'bg-gray-100 text-gray-700';
    case 'In Repair':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const fieldConfigs = {
  basic: [
    { key: 'asset_name', label: 'ASSET NAME *', type: 'text', required: true, placeholder: 'Enter asset name' },
    { key: 'asset_tag', label: 'ASSET TAG *', type: 'text', required: true, placeholder: 'Enter asset tag' },
    { key: 'asset_type', label: 'ASSET TYPE *', type: 'text', required: true, placeholder: 'Enter asset type' },
    { key: 'serial_number', label: 'SERIAL NUMBER *', type: 'text', required: true, placeholder: 'Enter serial number' },
    { key: 'status', label: 'Status', type: 'select', options: ['In Stock', 'Allocated', 'Under Repair', 'Scrapped', 'Returned'], placeholder: 'Select status' },
    { key: 'condition', label: 'Condition *', type: 'select', options: ['New', 'Fair', 'Damaged', 'Good'], required: true, placeholder: 'Select condition' },
  ],
  purchase: [
    { key: 'brand', label: 'BRAND', type: 'text', placeholder: 'Enter brand' },
    { key: 'model', label: 'MODEL', type: 'text', placeholder: 'Enter model' },
    { key: 'model_no', label: 'MODEL NO', type: 'text', placeholder: 'Enter model no' },
    { key: 'purchase_date', label: 'PURCHASE DATE', type: 'date' },
    { key: 'eol_date', label: 'EOL DATE', type: 'date' },
    { key: 'amc_start_date', label: 'AMC START DATE', type: 'date' },
    { key: 'amc_end_date', label: 'AMC END DATE', type: 'date' },
    { key: 'purchase_price', label: 'PURCHASE PRICE', type: 'number', placeholder: 'Enter purchase price' },
    { key: 'rental_cost', label: 'RENTAL COST', type: 'number', placeholder: 'Enter rental cost' },
    { key: 'vendor_id', label: 'Vendor', type: 'select', options: [], placeholder: 'Select Vendor' },
  ],
  technical: [
    { key: 'operating_system', label: 'OPERATING SYSTEM', type: 'text', placeholder: 'Enter operating system' },
    { key: 'ram', label: 'RAM', type: 'text', placeholder: 'Enter ram' },
    { key: 'hdd_capacity', label: 'HDD CAPACITY', type: 'text', placeholder: 'Enter hdd capacity' },
    { key: 'processor', label: 'PROCESSOR', type: 'text', placeholder: 'Enter processor' },
    { key: 'administrator', label: 'ADMINISTRATOR', type: 'text', placeholder: 'Enter administrator' },
    { key: 'additional_notes', label: 'ADDITIONAL NOTES', type: 'textarea', placeholder: 'Enter additional notes' },
  ],
};

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [viewAsset, setViewAsset] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    asset_name: '',
    asset_tag: '',
    asset_type: '',
    serial_number: '',
    status: 'In Stock',
    condition: 'Good',
    brand: '',
    model: '',
    model_no: '',
    purchase_date: '',
    eol_date: '',
    amc_start_date: '',
    amc_end_date: '',
    purchase_price: '',
    rental_cost: '',
    vendor_id: '',
    operating_system: '',
    ram: '',
    hdd_capacity: '',
    processor: '',
    administrator: '',
    additional_notes: '',
  });

  useEffect(() => {
    fetchAssets();
    fetchVendors();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await getAssets();
      setAssets(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch assets. Please check if the backend server is running.');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await getVendors();
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch vendors');
    }
  };

  const resetForm = () => {
    setFormData({
      asset_name: '',
      asset_tag: '',
      asset_type: '',
      serial_number: '',
      status: 'In Stock',
      condition: 'Good',
      brand: '',
      model: '',
      model_no: '',
      purchase_date: '',
      eol_date: '',
      amc_start_date: '',
      amc_end_date: '',
      purchase_price: '',
      rental_cost: '',
      vendor_id: '',
      operating_system: '',
      ram: '',
      hdd_capacity: '',
      processor: '',
      administrator: '',
      additional_notes: '',
    });
    setActiveTab('basic');
  };

  const handleAddAsset = () => {
    resetForm();
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleView = async (asset) => {
    try {
      const assetData = await getAssetById(asset.asset_id);
      setViewAsset(assetData);
      setIsViewOpen(true);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch asset details');
    }
  };

  const handleEdit = async (asset) => {
    try {
      const assetData = await getAssetById(asset.asset_id);
      setFormData({
        asset_name: assetData.asset_name?.trim() || '',
        asset_tag: assetData.asset_tag?.trim() || '',
        asset_type: assetData.asset_type?.trim() || '',
        serial_number: assetData.serial_number?.trim() || '',
        status: assetData.status || 'In Stock',
        condition: assetData.condition || 'Good',
        brand: assetData.brand?.trim() || '',
        model: assetData.model?.trim() || '',
        model_no: assetData.model_no?.trim() || '',
        purchase_date: assetData.purchase_date || '',
        eol_date: assetData.eol_date || '',
        amc_start_date: assetData.amc_start_date || '',
        amc_end_date: assetData.amc_end_date || '',
        purchase_price: assetData.purchase_price != null ? String(assetData.purchase_price) : '',
        rental_cost: assetData.rental_cost != null ? String(assetData.rental_cost) : '',
        vendor_id: assetData.vendor_id != null ? String(assetData.vendor_id) : '',
        operating_system: assetData.operating_system?.trim() || '',
        ram: assetData.ram?.trim() || '',
        hdd_capacity: assetData.hdd_capacity?.trim() || '',
        processor: assetData.processor?.trim() || '',
        administrator: assetData.administrator?.trim() || '',
        additional_notes: assetData.additional_notes?.trim() || '',
      });
      setViewAsset(assetData);
      setIsEditing(true);
      setActiveTab('basic');
      setIsModalOpen(true);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load asset details');
    }
  };


  const handleDelete = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(assetId);
        fetchAssets();
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to delete asset');
      }
    }
  };

  const onChangeField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: typeof value === 'string' ? value.trim() : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredKeys = ['asset_name', 'asset_tag', 'asset_type', 'serial_number', 'condition'];
    for (const key of requiredKeys) {
      if (!formData[key]?.trim()) {
        setError(`Please fill required field: ${fieldConfigs.basic.find((f) => f.key === key).label}`);
        return;
      }
    }

    // Validate purchase_price and rental_cost
    if (formData.purchase_price && isNaN(Number(formData.purchase_price))) {
      setError('Purchase price must be a valid number');
      return;
    }
    if (formData.rental_cost && isNaN(Number(formData.rental_cost))) {
      setError('Rental cost must be a valid number');
      return;
    }

    // Validate date fields
    const dateFields = ['purchase_date', 'eol_date', 'amc_start_date', 'amc_end_date'];
    for (const key of dateFields) {
      if (formData[key] && !/^\d{4}-\d{2}-\d{2}$/.test(formData[key])) {
        setError(`${fieldConfigs.purchase.find((f) => f.key === key).label} must be a valid date (YYYY-MM-DD)`);
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        asset_name: formData.asset_name.trim(),
        asset_tag: formData.asset_tag.trim(),
        asset_type: formData.asset_type.trim(),
        serial_number: formData.serial_number.trim(),
        brand: formData.brand?.trim() || null,
        model: formData.model?.trim() || null,
        model_no: formData.model_no?.trim() || null,
        purchase_date: formData.purchase_date || null,
        eol_date: formData.eol_date || null,
        amc_start_date: formData.amc_start_date || null,
        amc_end_date: formData.amc_end_date || null,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
        rental_cost: formData.rental_cost ? Number(formData.rental_cost) : null,
        vendor_id: formData.vendor_id ? Number(formData.vendor_id) : null,
        operating_system: formData.operating_system?.trim() || null,
        ram: formData.ram?.trim() || null,
        hdd_capacity: formData.hdd_capacity?.trim() || null,
        processor: formData.processor?.trim() || null,
        administrator: formData.administrator?.trim() || null,
        additional_notes: formData.additional_notes?.trim() || null,
      };
      if (isEditing && viewAsset) {
        await updateAsset(viewAsset.asset_id, payload);
      } else {
        await createAsset(payload);
      }
      setIsModalOpen(false);
      setIsEditing(false);
      setViewAsset(null);
      resetForm();
      fetchAssets();
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to save asset. Please check if the backend server is running.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    resetForm();
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    setViewAsset(null);
  };

  const display = (val) => (val && String(val).trim() !== '' ? val : '-');

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <button
            onClick={handleAddAsset}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            Add Asset
          </button>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        {loading && <p className="text-gray-500">Loading assets...</p>}

        {Array.isArray(assets) && assets.length === 0 && !loading && (
          <p className="text-gray-500">No assets found.</p>
        )}

        {Array.isArray(assets) && assets.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.map((asset, index) => (
                    <tr key={asset.asset_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{asset.asset_name}</div>
                          <div className="text-sm text-gray-500">
                            Vendor: {vendors.length > 0 ? (vendors.find((v) => v.vendor_id === asset.vendor_id)?.vendor_name || '-') : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-sm font-semibold text-blue-700 bg-blue-50 rounded">{asset.asset_tag}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700">{asset.asset_type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClasses(asset.status)}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(asset)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(asset)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.asset_id)}
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
        )}

        {/* Modal: Add/Edit Asset */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">{isEditing ? 'Edit Asset' : 'Add Asset'}</h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="flex">
                {/* Vertical Tabs */}
                <div className="w-56 border-r p-4 space-y-2">
                  {[
                    { key: 'basic', label: 'Basic Information' },
                    { key: 'purchase', label: 'Purchase Details' },
                    { key: 'technical', label: 'Technical Specifications' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeTab === t.key ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Forms */}
                <form onSubmit={handleSubmit} className="flex-1 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fieldConfigs[activeTab].map((f) => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                        {f.type === 'select' ? (
                          <select
                            value={formData[f.key]}
                            onChange={(e) => onChangeField(f.key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">{f.placeholder || 'Select'}</option>
                            {f.key === 'vendor_id'
                              ? vendors.map((vendor) => (
                                <option key={vendor.vendor_id} value={vendor.vendor_id}>
                                  {vendor.vendor_name}
                                </option>
                              ))
                              : f.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
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
                            required={f.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>

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
                      {isEditing ? 'Save Changes' : 'Add Asset'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: View Asset Details */}
        {isViewOpen && viewAsset && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Asset Details</h2>
                <button onClick={handleCloseView} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Section: Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <div className="text-gray-900">{display(viewAsset.asset_name)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tag</label>
                      <div className="text-gray-900">{display(viewAsset.asset_tag)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <div className="text-gray-900">{display(viewAsset.asset_type)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Serial Number</label>
                      <div className="text-gray-900">{display(viewAsset.serial_number)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="text-gray-900">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${viewAsset.status ? statusBadgeClasses(viewAsset.status) : 'bg-gray-100 text-gray-800'}`}>
                          {display(viewAsset.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Condition</label>
                      <div className="text-gray-900">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${viewAsset.condition === 'New' ? 'bg-blue-100 text-blue-800' : viewAsset.condition === 'Used' ? 'bg-yellow-100 text-yellow-800' : viewAsset.condition === 'Refurbished' ? 'bg-purple-100 text-purple-800' : viewAsset.condition === 'Good' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {display(viewAsset.condition)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Purchase Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Purchase Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Brand</label>
                      <div className="text-gray-900">{display(viewAsset.brand)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Model</label>
                      <div className="text-gray-900">{display(viewAsset.model)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Model No</label>
                      <div className="text-gray-900">{display(viewAsset.model_no)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Purchase Date</label>
                      <div className="text-gray-900">{display(viewAsset.purchase_date)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">EOL Date</label>
                      <div className="text-gray-900">{display(viewAsset.eol_date)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">AMC Start Date</label>
                      <div className="text-gray-900">{display(viewAsset.amc_start_date)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">AMC End Date</label>
                      <div className="text-gray-900">{display(viewAsset.amc_end_date)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Purchase Price</label>
                      <div className="text-gray-900">{display(viewAsset.purchase_price)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Rental Cost</label>
                      <div className="text-gray-900">{display(viewAsset.rental_cost)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vendor</label>
                      <div className="text-gray-900">
                        {vendors.length > 0 ? (vendors.find((v) => v.vendor_id === viewAsset.vendor_id)?.vendor_name || '-') : '-'}
                      </div>
                    </div>
                    {/* <div>
                      <label className="text-sm font-medium text-gray-600">Vendor ID</label>
                      <div className="text-gray-900">{display(viewAsset.vendor_id)}</div>
                    </div> */}
                  </div>
                </div>

                {/* Section: Technical Specifications */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Operating System</label>
                      <div className="text-gray-900">{display(viewAsset.operating_system)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">RAM</label>
                      <div className="text-gray-900">{display(viewAsset.ram)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">HDD Capacity</label>
                      <div className="text-gray-900">{display(viewAsset.hdd_capacity)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Processor</label>
                      <div className="text-gray-900">{display(viewAsset.processor)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Administrator</label>
                      <div className="text-gray-900">{display(viewAsset.administrator)}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-600">Additional Notes</label>
                      <div className="text-gray-900">{display(viewAsset.additional_notes)}</div>
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

export default Assets;