import React, { useState } from 'react';
import { Eye, Edit, Plus, X } from 'lucide-react';

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

const mockVendors = ['Dell Technologies', 'HP Inc.', 'Microsoft', 'Logitech'];

const mockAssets = [
  {
    id: 1,
    name: 'Dell Latitude 7420',
    tag: 'ASSET-00123',
    type: 'Laptop',
    status: 'Active',
    condition: 'Good',
    serialNumber: 'DL7420-SN-001',
    brand: 'Dell',
    model: 'Latitude 7420',
    modelNo: 'DL-7420',
    purchaseDate: '2024-02-10',
    eolDate: '2027-02-10',
    amcStartDate: '2024-02-11',
    amcEndDate: '2025-02-11',
    purchasePrice: 125000,
    rentalCost: '',
    vendor: 'Dell Technologies',
    vendorId: '902',
    operatingSystem: 'Windows 11 Pro',
    ram: '16 GB',
    hddCapacity: '512 GB SSD',
    processor: 'Intel Core i7',
    administrator: 'IT Support Team',
    additionalNotes: 'Assigned to engineering team.'
  },
  {
    id: 2,
    name: 'HP Z24i Monitor',
    tag: 'ASSET-00456',
    type: 'Monitor',
    status: 'In Repair',
    condition: 'Used',
    serialNumber: 'HPZ24i-SN-0456',
    brand: 'HP',
    model: 'Z24i',
    modelNo: 'HP-Z24i',
    purchaseDate: '2023-09-18',
    eolDate: '',
    amcStartDate: '',
    amcEndDate: '',
    purchasePrice: 26000,
    rentalCost: '',
    vendor: 'HP Inc.',
    vendorId: '523',
    operatingSystem: '',
    ram: '',
    hddCapacity: '',
    processor: '',
    administrator: '',
    additionalNotes: 'Under repair - backlight issue.'
  },
  {
    id: 3,
    name: 'Office 365 E3 License',
    tag: 'LIC-00089',
    type: 'Software',
    status: 'Active',
    condition: 'New',
    serialNumber: 'O365-E3-00089',
    brand: 'Microsoft',
    model: 'Office 365 E3',
    modelNo: 'MS-O365E3',
    purchaseDate: '2024-01-02',
    eolDate: '2025-01-02',
    amcStartDate: '2024-01-02',
    amcEndDate: '2025-01-02',
    purchasePrice: 1350,
    rentalCost: '',
    vendor: 'Microsoft',
    vendorId: '771',
    operatingSystem: '',
    ram: '',
    hddCapacity: '',
    processor: '',
    administrator: 'Admin Portal',
    additionalNotes: 'Annual subscription.'
  },
  {
    id: 4,
    name: 'Logitech MX Keys Keyboard',
    tag: 'ASSET-00891',
    type: 'Peripheral',
    status: 'Inactive',
    condition: 'Used',
    serialNumber: 'LOGI-MXK-891',
    brand: 'Logitech',
    model: 'MX Keys',
    modelNo: 'LG-MXK',
    purchaseDate: '',
    eolDate: '',
    amcStartDate: '',
    amcEndDate: '',
    purchasePrice: 8500,
    rentalCost: '',
    vendor: 'Logitech',
    vendorId: '115',
    operatingSystem: '',
    ram: '',
    hddCapacity: '',
    processor: '',
    administrator: '',
    additionalNotes: ''
  }
];

const fieldConfigs = {
  basic: [
    { key: 'assetName', label: 'ASSET NAME *', type: 'text', required: true, placeholder: 'Enter asset name' },
    { key: 'assetTag', label: 'ASSET TAG *', type: 'text', required: true, placeholder: 'Enter asset tag' },
    { key: 'assetType', label: 'ASSET TYPE *', type: 'text', required: true, placeholder: 'Enter asset type' },
    { key: 'serialNumber', label: 'SERIAL NUMBER *', type: 'text', required: true, placeholder: 'Enter serial number' },
    { key: 'status', label: 'Status', type: 'select', options: ['In Stock', 'Allocated', 'In Repair', 'Inactive'], placeholder: 'Select status' },
    { key: 'condition', label: 'Condition *', type: 'select', options: ['New', 'Used', 'Refurbished', 'Good'], required: true, placeholder: 'Select condition' },
  ],
  purchase: [
    { key: 'brand', label: 'BRAND', type: 'text', placeholder: 'Enter brand' },
    { key: 'model', label: 'MODEL', type: 'text', placeholder: 'Enter model' },
    { key: 'modelNo', label: 'MODEL NO', type: 'text', placeholder: 'Enter model no' },
    { key: 'purchaseDate', label: 'PURCHASE DATE', type: 'date' },
    { key: 'eolDate', label: 'EOL DATE', type: 'date' },
    { key: 'amcStartDate', label: 'AMC START DATE', type: 'date' },
    { key: 'amcEndDate', label: 'AMC END DATE', type: 'date' },
    { key: 'purchasePrice', label: 'PURCHASE PRICE', type: 'number', placeholder: 'Enter purchase price' },
    { key: 'rentalCost', label: 'RENTAL COST', type: 'number', placeholder: 'Enter rental cost' },
    { key: 'vendor', label: 'Vendor', type: 'select', options: mockVendors, placeholder: 'Select Vendor' },
    { key: 'vendorId', label: 'Vendor ID', type: 'text', placeholder: 'Enter vendor ID' },
  ],
  technical: [
    { key: 'operatingSystem', label: 'OPERATING SYSTEM', type: 'text', placeholder: 'Enter operating system' },
    { key: 'ram', label: 'RAM', type: 'text', placeholder: 'Enter ram' },
    { key: 'hddCapacity', label: 'HDD CAPACITY', type: 'text', placeholder: 'Enter hdd capacity' },
    { key: 'processor', label: 'PROCESSOR', type: 'text', placeholder: 'Enter processor' },
    { key: 'administrator', label: 'ADMINISTRATOR', type: 'text', placeholder: 'Enter administrator' },
    { key: 'additionalNotes', label: 'ADDITIONAL NOTES', type: 'textarea', placeholder: 'Enter additional notes' },
  ],
};

const Assets = () => {
  const [assets, setAssets] = useState(mockAssets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    assetName: '', assetTag: '', assetType: '', serialNumber: '', status: 'In Stock', condition: 'Good',
    brand: '', model: '', modelNo: '', purchaseDate: '', eolDate: '', amcStartDate: '', amcEndDate: '', purchasePrice: '', rentalCost: '', vendor: '', vendorId: '',
    operatingSystem: '', ram: '', hddCapacity: '', processor: '', administrator: '', additionalNotes: ''
  });
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewAsset, setViewAsset] = useState(null);

  const handleView = (asset) => {
    setViewAsset(asset);
    setIsViewOpen(true);
  };

  const fetchAssetDetailsMock = (id) => {
    const found = assets.find((a) => a.id === id);
    if (!found) return null;
    // Simulate backend expansion of fields for edit
    return {
      assetName: found.name || '',
      assetTag: found.tag || '',
      assetType: found.type || '',
      serialNumber: found.serialNumber || '',
      status: found.status || 'In Stock',
      condition: found.condition || 'Good',
      brand: found.brand || '',
      model: found.model || '',
      modelNo: found.modelNo || '',
      purchaseDate: found.purchaseDate || '',
      eolDate: found.eolDate || '',
      amcStartDate: found.amcStartDate || '',
      amcEndDate: found.amcEndDate || '',
      purchasePrice: String(found.purchasePrice || ''),
      rentalCost: String(found.rentalCost || ''),
      vendor: found.vendor || '',
      vendorId: found.vendorId || '',
      operatingSystem: found.operatingSystem || '',
      ram: found.ram || '',
      hddCapacity: found.hddCapacity || '',
      processor: found.processor || '',
      administrator: found.administrator || '',
      additionalNotes: found.additionalNotes || '',
    };
  };

  const handleEdit = (asset) => {
    const data = fetchAssetDetailsMock(asset.id);
    if (data) {
      setFormData(data);
      setActiveTab('basic');
      setIsModalOpen(true);
    } else {
      alert('Failed to load asset details (mock).');
    }
  };

  const handleAddAsset = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseView = () => setIsViewOpen(false);

  const onChangeField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const requiredKeys = ['assetName', 'assetTag', 'assetType', 'serialNumber', 'condition'];

  const handleSubmit = (e) => {
    e.preventDefault();
    for (const k of requiredKeys) {
      if (!formData[k] || String(formData[k]).trim() === '') {
        alert(`Please fill required field: ${k}`);
        return;
      }
    }

    const newAsset = {
      id: assets.length ? Math.max(...assets.map((a) => a.id)) + 1 : 1,
      name: formData.assetName,
      tag: formData.assetTag,
      type: formData.assetType,
      status: formData.status || 'Active',
      condition: formData.condition || 'Good',
      serialNumber: formData.serialNumber || '',
      brand: formData.brand || '',
      model: formData.model || '',
      modelNo: formData.modelNo || '',
      purchaseDate: formData.purchaseDate || '',
      eolDate: formData.eolDate || '',
      amcStartDate: formData.amcStartDate || '',
      amcEndDate: formData.amcEndDate || '',
      purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : '',
      rentalCost: formData.rentalCost ? Number(formData.rentalCost) : '',
      vendor: formData.vendor || '',
      vendorId: formData.vendorId || '',
      operatingSystem: formData.operatingSystem || '',
      ram: formData.ram || '',
      hddCapacity: formData.hddCapacity || '',
      processor: formData.processor || '',
      administrator: formData.administrator || '',
      additionalNotes: formData.additionalNotes || '',
    };

    setAssets((prev) => [newAsset, ...prev]);
    setIsModalOpen(false);
    setFormData((prev) => ({
      ...prev,
      assetName: '', assetTag: '', assetType: '', serialNumber: '', condition: 'Good', status: 'In Stock', vendor: '', vendorId: ''
    }));
    alert('Asset added successfully (mock).');
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

        {/* Table */}
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset, index) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{asset.name}</div>
                        <div className="text-sm text-gray-500">Vendor: {display(asset.vendor)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-sm font-semibold text-blue-700 bg-blue-50 rounded">{asset.tag}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700">{asset.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClasses(asset.status)}`}>{asset.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleView(asset)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEdit(asset)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
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

        {/* Modal: Add Asset */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Add Asset</h2>
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
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        activeTab === t.key ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100 text-gray-700'
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
                            {f.options?.map((opt) => (
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
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Add Asset</button>
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
                      <div className="text-gray-900">{display(viewAsset.name)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tag</label>
                      <div className="text-gray-900">{display(viewAsset.tag)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <div className="text-gray-900">{display(viewAsset.type)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Serial Number</label>
                      <div className="text-gray-900">{display(viewAsset.serialNumber)}</div>
                    </div>
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
                      <div className="text-gray-900">{display(viewAsset.modelNo)}</div>
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
                      <label className="text-sm font-medium text-gray-600">Purchase Date</label>
                      <div className="text-gray-900">{display(viewAsset.purchaseDate)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">EOL Date</label>
                      <div className="text-gray-900">{display(viewAsset.eolDate)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">AMC Start Date</label>
                      <div className="text-gray-900">{display(viewAsset.amcStartDate)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">AMC End Date</label>
                      <div className="text-gray-900">{display(viewAsset.amcEndDate)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Purchase Price</label>
                      <div className="text-gray-900">{display(viewAsset.purchasePrice)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Rental Cost</label>
                      <div className="text-gray-900">{display(viewAsset.rentalCost)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vendor</label>
                      <div className="text-gray-900">{display(viewAsset.vendor)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vendor ID</label>
                      <div className="text-gray-900">{display(viewAsset.vendorId)}</div>
                    </div>
                  </div>
                </div>

                {/* Section: Technical Specifications */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Operating System</label>
                      <div className="text-gray-900">{display(viewAsset.operatingSystem)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">RAM</label>
                      <div className="text-gray-900">{display(viewAsset.ram)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">HDD Capacity</label>
                      <div className="text-gray-900">{display(viewAsset.hddCapacity)}</div>
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
                      <div className="text-gray-900">{display(viewAsset.additionalNotes)}</div>
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