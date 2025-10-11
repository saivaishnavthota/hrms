import React, { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getMaintenanceRecords, deleteMaintenance } from '../../api/maintenance';
import { getAssets } from '../../api/assets';
import { getVendors } from '../../api/vendors';
import MaintenanceForm from './MaintenanceForm';
import { ThemeContext } from '../../App';
import './Maintenance.css';

export default function MaintenanceList() {
  const theme = useContext(ThemeContext);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editMaintenance, setEditMaintenance] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ asset_id: '', maintenance_type: '' });
  const [sortBy, setSortBy] = useState('start_date');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['maintenance', filters],
    queryFn: () => getMaintenanceRecords(filters),
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: getVendors,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenance,
    onSuccess: () => {
      toast.success('Maintenance record deleted successfully!');
      queryClient.invalidateQueries(['maintenance']);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error deleting maintenance record'),
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (maintenance) => {
    setEditMaintenance(maintenance);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditMaintenance(null);
    queryClient.invalidateQueries(['maintenance']);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getAssetName = (asset_id) => {
    const asset = assets.find(a => a.asset_id === asset_id);
    return asset ? asset.asset_name : asset_id;
  };

  const getVendorName = (vendor_id) => {
    const vendor = vendors.find(v => v.vendor_id === vendor_id);
    return vendor ? vendor.vendor_name : '-';
  };

  const sortedAndFilteredRecords = records
    .filter(r =>
      (getAssetName(r.asset_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
       (r.vendor_id && getVendorName(r.vendor_id).toLowerCase().includes(searchQuery.toLowerCase())))
    )
    .sort((a, b) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  if (recordsLoading || assetsLoading || vendorsLoading) return <div className="loading-spinner"></div>;

  return (
    <div className="list-container maintenance-list">
      <h2>Asset Maintenance Records</h2>
      <button className="create-btn" onClick={() => { setShowForm(!showForm); setEditMaintenance(null); }}>
        {showForm ? 'Hide Form' : 'Create Maintenance'}
      </button>
      {showForm && (
        <MaintenanceForm
          onSuccess={handleSuccess}
          initialData={editMaintenance}
          mode={editMaintenance ? 'edit' : 'create'}
        />
      )}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by asset or vendor name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button><FaSearch /></button>
      </div>
      <div className="filters">
        <select name="asset_id" value={filters.asset_id} onChange={handleFilterChange}>
          <option value="">All Assets</option>
          {assets.map(a => (
            <option key={a.asset_id} value={a.asset_id}>{a.asset_name}</option>
          ))}
        </select>
        <select name="maintenance_type" value={filters.maintenance_type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="Warranty">Warranty</option>
          <option value="AMC">AMC</option>
          <option value="Repair">Repair</option>
        </select>
      </div>
      <div className="table-container">
        <table className="maintenance-table">
          <thead>
            <tr>
              <th onClick={() => { setSortBy('asset_id'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Asset {sortBy === 'asset_id' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('maintenance_type'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Type {sortBy === 'maintenance_type' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('start_date'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Start Date {sortBy === 'start_date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredRecords.map((r) => (
              <tr key={r.maintenance_id}>
                <td>{getAssetName(r.asset_id)}</td>
                <td>{r.maintenance_type}</td>
                <td>{r.start_date}</td>
                <td className="actions">
                  <button className="action-btn edit-btn" onClick={() => handleEdit(r)} title="Edit">
                    <FaEdit />
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(r.maintenance_id)} title="Delete">
                    <FaTrash />
                  </button>
                  <button className="action-btn details-btn" onClick={() => setSelectedMaintenance(r)} title="View Details">
                    <FaEye/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMaintenance && (
        <div className="modal">
          <div className="modal-content">
            <h3>Maintenance Record Details</h3>
            <div className="form-group">
              <label>Asset:</label> <span>{getAssetName(selectedMaintenance.asset_id)}</span>
            </div>
            <div className="form-group">
              <label>Maintenance Type:</label> <span>{selectedMaintenance.maintenance_type}</span>
            </div>
            <div className="form-group">
              <label>Start Date:</label> <span>{selectedMaintenance.start_date}</span>
            </div>
            <div className="form-group">
              <label>End Date:</label> <span>{selectedMaintenance.end_date || '-'}</span>
            </div>
            <div className="form-group">
              <label>Vendor:</label> <span>{getVendorName(selectedMaintenance.vendor_id)}</span>
            </div>
            <div className="form-group">
              <label>Cost:</label> <span>{selectedMaintenance.cost || '-'}</span>
            </div>
            <div className="form-group">
              <label>Notes:</label> <span>{selectedMaintenance.notes || '-'}</span>
            </div>
            <button className="modal-close" onClick={() => setSelectedMaintenance(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}