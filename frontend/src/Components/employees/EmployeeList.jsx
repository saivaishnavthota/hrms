import React, { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getEmployees, deleteEmployee } from '../../api/employees';
import EmployeeForm from './EmployeeForm';
import { ThemeContext } from '../../App';
import './Employee.css';

export default function EmployeeList() {
  const theme = useContext(ThemeContext);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ role: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => getEmployees(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success('Employee deleted successfully!');
      queryClient.invalidateQueries(['employees']);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error deleting employee'),
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (employee) => {
    setEditEmployee(employee);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditEmployee(null);
    queryClient.invalidateQueries(['employees']);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const sortedAndFilteredEmployees = employees
    .filter(e =>
      (e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       e.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filters.role ? e.role?.toLowerCase().includes(filters.role.toLowerCase()) : true)
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
    <div className="list-container employee-list">
      <h2>Employees</h2>
      <button className="create-btn" onClick={() => { setShowForm(!showForm); setEditEmployee(null); }}>
        {showForm ? 'Hide Form' : 'Create Employee'}
      </button>
      {showForm && (
        <EmployeeForm
          onSuccess={handleSuccess}
          initialData={editEmployee}
          mode={editEmployee ? 'edit' : 'create'}
        />
      )}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button><FaSearch /></button>
      </div>
      <div className="filters">
        <input
          name="role"
          placeholder="Filter by Role"
          value={filters.role}
          onChange={handleFilterChange}
        />
      </div>
      <div className="table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th onClick={() => { setSortBy('name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Name {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => { setSortBy('role'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Role {sortBy === 'role' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredEmployees.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.role || '-'}</td>
                <td>{e.email || '-'}</td>
                <td className="actions">
                  <button className="action-btn edit-btn" onClick={() => handleEdit(e)} title="Edit">
                    <FaEdit />
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(e.id)} title="Delete">
                    <FaTrash />
                  </button>
                  <button className="action-btn details-btn" onClick={() => setSelectedEmployee(e)} title="View Details">
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEmployee && (
        <div className="modal">
          <div className="modal-content">
            <h3>Employee Details</h3>
            <div className="form-group">
              <label>Name:</label> <span>{selectedEmployee.name}</span>
            </div>
            <div className="form-group">
              <label>Email:</label> <span>{selectedEmployee.email || '-'}</span>
            </div>
            <div className="form-group">
              <label>Role:</label> <span>{selectedEmployee.role || '-'}</span>
            </div>
            <button className="modal-close" onClick={() => setSelectedEmployee(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}