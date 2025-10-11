import React, { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getAssets, deleteAsset } from '../../api/assets';
import AssetForm from './AssetForm';
import { ThemeContext } from '../../App';
import './Asset.css';

export default function AssetList() {
  const theme = useContext(ThemeContext);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: '', condition: '', asset_type: '' });
  const [sortBy, setSortBy] = useState('asset_name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedAsset, setSelectedAsset] = useState(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', filters],
    queryFn: () => getAssets(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      toast.success('Asset deleted successfully!');
      queryClient.invalidateQueries(['assets']);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error deleting asset'),
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (asset) => {
    setEditAsset(asset);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditAsset(null);
    queryClient.invalidateQueries(['assets']);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const sortedAndFilteredAssets = assets
    .filter(a =>
      (a.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filters.condition ? a.condition === filters.condition : true)
    )
    .sort((a, b) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  if (isLoading) return <div className="loading-spinner"></div>;

  return (
    <div className="list-container">
      <h2>Assets</h2>
      <button className="create-btn" onClick={() => { setShowForm(!showForm); setEditAsset(null); }}>
        {showForm ? 'Hide Form' : 'Create Asset'}
      </button>
      {showForm && (
        <AssetForm
          onSuccess={handleSuccess}
          initialData={editAsset}
          mode={editAsset ? 'edit' : 'create'}
        />
      )}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, tag, or serial..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button><FaSearch /></button>
      </div>
      <div className="filters">
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Allocated">Allocated</option>
          <option value="Under Repair">Under Repair</option>
          <option value="Scrapped">Scrapped</option>
          <option value="Returned">Returned</option>
        </select>
        <select name="condition" value={filters.condition} onChange={handleFilterChange}>
          <option value="">All Conditions</option>
          <option value="New">New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Damaged">Damaged</option>
        </select>
        <input
          name="asset_type"
          placeholder="Filter by Type"
          value={filters.asset_type}
          onChange={handleFilterChange}
        />
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => { setSortBy('asset_name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Name {sortBy === 'asset_name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('asset_tag'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Tag {sortBy === 'asset_tag' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('asset_type'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Type {sortBy === 'asset_type' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('status'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Status {sortBy === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('condition'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Condition {sortBy === 'condition' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredAssets.map((a) => (
              <tr key={a.asset_id}>
                <td>{a.asset_name}</td>
                <td>{a.asset_tag}</td>
                <td>{a.asset_type}</td>
                <td>{a.status}</td>
                <td>{a.condition}</td>
                <td className="actions">
                  <button className="action-btn edit-btn" onClick={() => handleEdit(a)} title="Edit">
                    <FaEdit />
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(a.asset_id)} title="Delete">
                    <FaTrash />
                  </button>
                  <button className="action-btn details-btn" onClick={() => setSelectedAsset(a)} title="View Details">
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAsset && (
        <div className="modal">
          <div className="modal-content">
            <h3>Asset Details</h3>
            <div className="form-group">
              <label>Name:</label> <span>{selectedAsset.asset_name}</span>
            </div>
            <div className="form-group">
              <label>Tag:</label> <span>{selectedAsset.asset_tag}</span>
            </div>
            <div className="form-group">
              <label>Type:</label> <span>{selectedAsset.asset_type}</span>
            </div>
            <div className="form-group">
              <label>Serial Number:</label> <span>{selectedAsset.serial_number}</span>
            </div>
            <div className="form-group">
              <label>Brand:</label> <span>{selectedAsset.brand || '-'}</span>
            </div>
            <div className="form-group">
              <label>Model:</label> <span>{selectedAsset.model || '-'}</span>
            </div>
            <div className="form-group">
              <label>Model No:</label> <span>{selectedAsset.model_no || '-'}</span>
            </div>
            <div className="form-group">
              <label>Purchase Date:</label> <span>{selectedAsset.purchase_date || '-'}</span>
            </div>
            <div className="form-group">
              <label>EOL Date:</label> <span>{selectedAsset.eol_date || '-'}</span>
            </div>
            <div className="form-group">
              <label>AMC Start Date:</label> <span>{selectedAsset.amc_start_date || '-'}</span>
            </div>
            <div className="form-group">
              <label>AMC End Date:</label> <span>{selectedAsset.amc_end_date || '-'}</span>
            </div>
            <div className="form-group">
              <label>Purchase Price:</label> <span>{selectedAsset.purchase_price || '-'}</span>
            </div>
            <div className="form-group">
              <label>Rental Cost:</label> <span>{selectedAsset.rental_cost || '-'}</span>
            </div>
            <div className="form-group">
              <label>Vendor ID:</label> <span>{selectedAsset.vendor_id || '-'}</span>
            </div>
            <div className="form-group">
              <label>Status:</label> <span>{selectedAsset.status}</span>
            </div>
            <div className="form-group">
              <label>Condition:</label> <span>{selectedAsset.condition}</span>
            </div>
            <div className="form-group">
              <label>Operating System:</label> <span>{selectedAsset.operating_system || '-'}</span>
            </div>
            <div className="form-group">
              <label>RAM:</label> <span>{selectedAsset.ram || '-'}</span>
            </div>
            <div className="form-group">
              <label>HDD Capacity:</label> <span>{selectedAsset.hdd_capacity || '-'}</span>
            </div>
            <div className="form-group">
              <label>Processor:</label> <span>{selectedAsset.processor || '-'}</span>
            </div>
            <div className="form-group">
              <label>Administrator:</label> <span>{selectedAsset.administrator || '-'}</span>
            </div>
            <div className="form-group">
              <label>Additional Notes:</label> <span>{selectedAsset.additional_notes || '-'}</span>
            </div>
            <button className="modal-close" onClick={() => setSelectedAsset(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}