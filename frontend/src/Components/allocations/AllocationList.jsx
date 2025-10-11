import React, { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getAllocations, deleteAllocation } from '../../api/allocations';
import { getAssets } from '../../api/assets';
import { getEmployees } from '../../api/employees';
import AllocationForm from './AllocationForm';
import { ThemeContext } from '../../App';
import './Allocation.css';

export default function AllocationList() {
  const theme = useContext(ThemeContext);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editAllocation, setEditAllocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ asset_id: '', employee_id: '' });
  const [sortBy, setSortBy] = useState('allocation_date');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  const { data: allocations = [], isLoading: allocationsLoading } = useQuery({
    queryKey: ['allocations', filters],
    queryFn: () => getAllocations(filters),
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAllocation,
    onSuccess: () => {
      toast.success('Allocation deleted successfully!');
      queryClient.invalidateQueries(['allocations']);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error deleting allocation'),
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (allocation) => {
    setEditAllocation(allocation);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditAllocation(null);
    queryClient.invalidateQueries(['allocations']);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getAssetName = (asset_id) => {
    const asset = assets.find(a => a.asset_id === asset_id);
    return asset ? asset.asset_name : asset_id;
  };

  const getEmployeeName = (employee_id) => {
    const employee = employees.find(e => e.id === employee_id);
    return employee ? employee.name : employee_id;
  };

  const sortedAndFilteredAllocations = allocations
    .filter(a =>
      (getAssetName(a.asset_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
       getEmployeeName(a.employee_id).toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  if (allocationsLoading || assetsLoading || employeesLoading) return <div className="loading-spinner"></div>;

  return (
    <div className="list-container allocation-list">
      <h2>Asset Allocations</h2>
      <button className="create-btn" onClick={() => { setShowForm(!showForm); setEditAllocation(null); }}>
        {showForm ? 'Hide Form' : 'Create Allocation'}
      </button>
      {showForm && (
        <AllocationForm
          onSuccess={handleSuccess}
          initialData={editAllocation}
          mode={editAllocation ? 'edit' : 'create'}
        />
      )}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by asset or employee name..."
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
        <select name="employee_id" value={filters.employee_id} onChange={handleFilterChange}>
          <option value="">All Employees</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
      <div className="table-container">
        <table className="allocation-table">
          <thead>
            <tr>
              <th onClick={() => { setSortBy('asset_id'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Asset {sortBy === 'asset_id' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('employee_id'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Employee {sortBy === 'employee_id' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('allocation_date'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Allocation Date {sortBy === 'allocation_date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredAllocations.map((a) => (
              <tr key={a.allocation_id}>
                <td>{getAssetName(a.asset_id)}</td>
                <td>{getEmployeeName(a.employee_id)}</td>
                <td>{a.allocation_date}</td>
                <td className="actions">
                  <button className="action-btn edit-btn" onClick={() => handleEdit(a)} title="Edit">
                    <FaEdit />
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(a.allocation_id)} title="Delete">
                    <FaTrash />
                  </button>
                  <button className="action-btn details-btn" onClick={() => setSelectedAllocation(a)} title="View Details">
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAllocation && (
        <div className="modal">
          <div className="modal-content">
            <h3>Allocation Details</h3>
            <div className="form-group">
              <label>Asset:</label> <span>{getAssetName(selectedAllocation.asset_id)}</span>
            </div>
            <div className="form-group">
              <label>Employee:</label> <span>{getEmployeeName(selectedAllocation.employee_id)}</span>
            </div>
            <div className="form-group">
              <label>Allocation Date:</label> <span>{selectedAllocation.allocation_date}</span>
            </div>
            <div className="form-group">
              <label>Expected Return Date:</label> <span>{selectedAllocation.expected_return_date || '-'}</span>
            </div>
            <div className="form-group">
              <label>Actual Return Date:</label> <span>{selectedAllocation.actual_return_date || '-'}</span>
            </div>
            <div className="form-group">
              <label>Condition at Allocation:</label> <span>{selectedAllocation.condition_at_allocation || '-'}</span>
            </div>
            <div className="form-group">
              <label>Condition at Return:</label> <span>{selectedAllocation.condition_at_return || '-'}</span>
            </div>
            <div className="form-group">
              <label>Employee Acknowledgment:</label> <span>{selectedAllocation.employee_ack ? 'Yes' : 'No'}</span>
            </div>
            <div className="form-group">
              <label>Notes:</label> <span>{selectedAllocation.notes || '-'}</span>
            </div>
            <button className="modal-close" onClick={() => setSelectedAllocation(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}