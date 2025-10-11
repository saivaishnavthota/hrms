import React, { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getVendors, deleteVendor } from '../../api/vendors';
import VendorForm from './VendorForm';
import { ThemeContext } from '../../App';
import './Vendor.css';

export default function VendorList() {
  const theme = useContext(ThemeContext);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ vendor_type: '' });
  const [sortBy, setSortBy] = useState('vendor_name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', filters],
    queryFn: () => getVendors(filters.vendor_type || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      toast.success('Vendor deleted successfully!');
      queryClient.invalidateQueries(['vendors']);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error deleting vendor'),
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (vendor) => {
    setEditVendor(vendor);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditVendor(null);
    queryClient.invalidateQueries(['vendors']);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const sortedAndFilteredVendors = vendors
    .filter(v =>
      (v.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       v.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
       v.contact_phone.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filters.vendor_type ? v.vendor_type === filters.vendor_type : true)
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
    <div className="list-container vendor-list">
      <h2>Vendors</h2>
      <button className="create-btn" onClick={() => { setShowForm(!showForm); setEditVendor(null); }}>
        {showForm ? 'Hide Form' : 'Create Vendor'}
      </button>
      {showForm && (
        <VendorForm
          onSuccess={handleSuccess}
          initialData={editVendor}
          mode={editVendor ? 'edit' : 'create'}
        />
      )}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button><FaSearch /></button>
      </div>
      <div className="filters">
        <select name="vendor_type" value={filters.vendor_type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="Purchased">Purchased</option>
          <option value="Rental">Rental</option>
        </select>
      </div>
      <div className="table-container">
        <table className="vendor-table">
          <thead>
            <tr>
              <th onClick={() => { setSortBy('vendor_name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Name {sortBy === 'vendor_name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('vendor_type'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Type {sortBy === 'vendor_type' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredVendors.map((v) => (
              <tr key={v.vendor_id}>
                <td>{v.vendor_name}</td>
                <td>{v.vendor_type}</td>
                <td>{v.contact_email || '-'}</td>
                <td>{v.contact_phone || '-'}</td>
                <td className="actions">
                  <button className="action-btn edit-btn" onClick={() => handleEdit(v)} title="Edit">
                    <FaEdit />
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(v.vendor_id)} title="Delete">
                    <FaTrash />
                  </button>
                  <button className="action-btn details-btn" onClick={() => setSelectedVendor(v)} title="View Details">
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVendor && (
        <div className="modal">
          <div className="modal-content">
            <h3>Vendor Details</h3>
            <div className="form-group">
              <label>Name:</label> <span>{selectedVendor.vendor_name}</span>
            </div>
            <div className="form-group">
              <label>Type:</label> <span>{selectedVendor.vendor_type}</span>
            </div>
            <div className="form-group">
              <label>Email:</label> <span>{selectedVendor.contact_email || '-'}</span>
            </div>
            <div className="form-group">
              <label>Phone:</label> <span>{selectedVendor.contact_phone || '-'}</span>
            </div>
            <div className="form-group">
              <label>Payment Terms:</label> <span>{selectedVendor.payment_terms || '-'}</span>
            </div>
            <button className="modal-close" onClick={() => setSelectedVendor(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}