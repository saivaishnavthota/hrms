import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  UserPlus,
  X,
  User,
  Mail
} from 'lucide-react';
import { toast } from 'react-toastify' ;
import api from '../../lib/api';
import { useUser } from '@/contexts/UserContext';

const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500'
  ];
  const index = name.length % colors.length;
  return colors[index];
};

const EmployeeManagement = () => {
  const { user } = useUser();
  const isSuperHR = user?.role === 'HR' && user?.super_hr === true;
  
  // Debug logging
  console.log('EmployeeManagement - User:', user);
  console.log('EmployeeManagement - isSuperHR:', isSuperHR);
  console.log('EmployeeManagement - user.super_hr:', user?.super_hr);
  
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    role: 'Employee',
    type: ''
  });
  const [addFormErrors, setAddFormErrors] = useState({});

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    companyMail: '',
    companyEmployeeId: '',
    role: '',
    dateOfJoining: '',
    location: '',
    hr1: '',
    hr2: '',
    manager1: '',
    manager2: '',
    manager3: ''
  });
  const [editFormErrors, setEditFormErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [employeesRes, managersRes, hrsRes, locationsRes] = await Promise.all([
        api.get('/users/employees'),
        api.get('/users/managers'),
        api.get('/users/hrs'),
        api.get('/locations/')
      ]);

      const rawEmployees = Array.isArray(employeesRes.data?.data)
        ? employeesRes.data.data
        : Array.isArray(employeesRes.data)
          ? employeesRes.data
          : Array.isArray(employeesRes.data?.employees)
            ? employeesRes.data.employees
            : [];

      const employeesData = rawEmployees.map(emp => ({
        id: emp.employeeId ?? emp.id,
        name: emp.name,
        to_email: emp.to_email ?? emp.personal_email,
        company_email: emp.email ?? emp.company_email,
        company_employee_id: emp.company_employee_id,
        reassignment: emp.reassignment === true,
        type: emp.type || 'Full-time',
        designation: emp.role || 'Employee',
        status: emp.status || 'Active',
        location: emp.location_name || emp.location || '',
        locationId: emp.location_id || null,
        dateOfJoining: emp.doj || '',
        hr: emp.hr && emp.hr.length > 0 ? emp.hr.join(', ') : 'Not Assigned',
        managers: emp.managers && emp.managers.length > 0 ? emp.managers.join(', ') : 'Not Assigned',
        joinedDate: emp.created_at ? emp.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        avatar: emp.name ? emp.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'NA',
        document_count: emp.document_count || 0
      }));
  
      setEmployees(employeesData);
      setManagers(managersRes.data.managers || []);
      setHrs(hrsRes.data.HRs || []);
      setLocations(locationsRes.data.status === 'success' ? locationsRes.data.data : []);
      
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError('Failed to load employee data');
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.company_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.company_employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || employee.type?.toLowerCase() === typeFilter.toLowerCase();
    const matchesLocation = locationFilter === 'all' || employee.location === locationFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesLocation;
  });

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    const assignedHRs = employee.hr && employee.hr !== 'Not Assigned' ? employee.hr.split(', ') : [];
    const assignedManagers = employee.managers && employee.managers !== 'Not Assigned' ? employee.managers.split(', ') : [];

    setEditFormData({
      fullName: employee.name || '',
      companyMail: employee.company_email || '',
      companyEmployeeId: employee.company_employee_id || '',
      role: employee.designation || '',
      dateOfJoining: employee.dateOfJoining || '',
      location: employee.location,
      hr1: assignedHRs[0] || '',
      hr2: assignedHRs[1] || '',
      manager1: assignedManagers[0] || '',
      manager2: assignedManagers[1] || '',
      manager3: assignedManagers[2] || ''
    });
    setEditFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleAddInputChange = (field, value) => {
    setAddFormData(prev => ({ ...prev, [field]: value }));
    if (addFormErrors[field]) {
      setAddFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateAddForm = () => {
    const errors = {};
    if (!addFormData.name.trim()) errors.name = 'Name is required';
    if (!addFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!addFormData.role) errors.role = 'Role is required';
    if (!addFormData.type) errors.type = 'Employment type is required';
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateAddForm()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        name: addFormData.name,
        email: addFormData.email,
        type: addFormData.type,
        role: addFormData.role
      };
      
      await api.post('/onboarding/hr/create_employee', submitData);
      toast.success('Employee created successfully!');
      
      setAddFormData({ name: '', email: '', role: 'Employee', type: '' });
      setIsModalOpen(false);
      await fetchAllData();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Error creating employee: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    if (editFormErrors[field]) {
      setEditFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.companyMail.trim()) {
      errors.companyMail = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(editFormData.companyMail)) {
      errors.companyMail = 'Please enter a valid email address';
    }
    if (!selectedEmployee?.reassignment && !editFormData.dateOfJoining.trim()) {
      errors.dateOfJoining = 'Date of joining is required';
    }
    if (!editFormData.location) errors.location = 'Location is required';
    if (!editFormData.hr1) errors.hr1 = 'HR-1 is required';
    if (!editFormData.manager1) errors.manager1 = 'Manager-1 is required';
    
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    setIsSubmitting(true);
    try {
      const hr1Id = hrs.find(hr => hr.name === editFormData.hr1)?.id;
      const hr2Id = hrs.find(hr => hr.name === editFormData.hr2)?.id;
      const manager1Id = managers.find(m => m.name === editFormData.manager1)?.id;
      const manager2Id = managers.find(m => m.name === editFormData.manager2)?.id;
      const manager3Id = managers.find(m => m.name === editFormData.manager3)?.id;
      const locationId = locations.find(l => l.name === editFormData.location)?.id;

      let response;
      
      if (selectedEmployee?.reassignment) {
        const reassignBody = {
          employee_id: selectedEmployee?.id || 0,
          location_id: locationId || 0,
          company_email: editFormData.companyMail,
          role: editFormData.role || selectedEmployee?.designation || 'Employee'
        };
        
        if (manager1Id) reassignBody.manager1_id = manager1Id;
        if (manager2Id) reassignBody.manager2_id = manager2Id;
        if (manager3Id) reassignBody.manager3_id = manager3Id;
        if (hr1Id) reassignBody.hr1_id = hr1Id;
        if (hr2Id) reassignBody.hr2_id = hr2Id;
        
        response = await api.post('/onboarding/hr/reassign', reassignBody);
      } else {
        if (!editFormData.dateOfJoining || !editFormData.dateOfJoining.trim()) {
          toast.error('Date of joining is required for assignment');
          return;
        }
        
        const assignBody = {
          employee_id: selectedEmployee?.id || 0,
          location_id: locationId || 0,
          doj: editFormData.dateOfJoining,
          to_email: selectedEmployee?.to_email,
          company_email: editFormData.companyMail,
          company_employee_id: editFormData.companyEmployeeId || null,
          role: editFormData.role || 'Employee',
          manager1_id: manager1Id || null,
          manager2_id: manager2Id || null,
          manager3_id: manager3Id || null,
          hr1_id: hr1Id || null,
          hr2_id: hr2Id || null
        };
        
        response = await api.post('/onboarding/hr/assign', assignBody);
      }
      
      if (response.status === 200) {
        toast.success(selectedEmployee?.reassignment ? "Employee reassigned successfully!" : "Employee assigned successfully!");
        await fetchAllData();
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error assigning/reassigning employee:', error);
      toast.error('Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          {isSuperHR && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Add Employee
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name, email, or company ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading employees...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p>{error}</p>
            <button 
              onClick={fetchAllData}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Managers</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee, index) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center text-white font-medium`}>
                          {employee.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.company_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-sm font-semibold text-blue-700 bg-blue-50 rounded">
                        {employee.company_employee_id || 'Not Set'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        employee.designation === 'HR' ? 'text-purple-700 bg-purple-50' :
                        employee.designation === 'Manager' ? 'text-orange-700 bg-orange-50' :
                        'text-gray-700 bg-gray-50'
                      }`}>
                        {employee.designation || 'Employee'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.hr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.managers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewEmployee(employee)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {isSuperHR && (
                          <>
                            <button
                              onClick={() => handleEditEmployee(employee)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Assign/Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="text-sm text-gray-600">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
                <h2 className="text-xl font-bold text-white">Add New Employee</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={addFormData.name}
                      onChange={(e) => handleAddInputChange('name', e.target.value)}
                      className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                        addFormErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter employee name"
                    />
                  </div>
                  {addFormErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{addFormErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="email"
                      value={addFormData.email}
                      onChange={(e) => handleAddInputChange('email', e.target.value)}
                      className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                        addFormErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {addFormErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{addFormErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={addFormData.role}
                    onChange={(e) => handleAddInputChange('role', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      addFormErrors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Intern">Intern</option>
                  </select>
                  {addFormErrors.role && (
                    <p className="text-red-500 text-xs mt-1">{addFormErrors.role}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={addFormData.type}
                    onChange={(e) => handleAddInputChange('type', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      addFormErrors.type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                  {addFormErrors.type && (
                    <p className="text-red-500 text-xs mt-1">{addFormErrors.type}</p>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-blue-50">
                <h2 className="text-2xl font-bold text-blue-900">
                  {selectedEmployee.reassignment ? 'Reassign Employee' : 'Assign Employee'}
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.fullName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email {!selectedEmployee.reassignment && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    value={editFormData.companyMail}
                    onChange={(e) => handleEditInputChange('companyMail', e.target.value)}
                    disabled={selectedEmployee.reassignment}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      selectedEmployee.reassignment ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    } ${editFormErrors.companyMail ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {editFormErrors.companyMail && (
                    <p className="text-red-500 text-xs mt-1">{editFormErrors.companyMail}</p>
                  )}
                </div>
                {!selectedEmployee.reassignment && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Employee ID
                      </label>
                      <input
                        type="text"
                        value={editFormData.companyEmployeeId}
                        onChange={(e) => handleEditInputChange('companyEmployeeId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 800001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Joining <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={editFormData.dateOfJoining}
                        onChange={(e) => handleEditInputChange('dateOfJoining', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          editFormErrors.dateOfJoining ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {editFormErrors.dateOfJoining && (
                        <p className="text-red-500 text-xs mt-1">{editFormErrors.dateOfJoining}</p>
                      )}
                    </div>
                  </>
                )}
                {selectedEmployee.reassignment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Employee ID
                    </label>
                    <input
                      type="text"
                      value={editFormData.companyEmployeeId}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select 
                    value={editFormData.role}
                    onChange={(e) => handleEditInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select role</option>
                    <option value="Employee">Employee</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                    <option value="Account Manager">Account Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={editFormData.location}
                    onChange={(e) => handleEditInputChange('location', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      editFormErrors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                  {editFormErrors.location && (
                    <p className="text-red-500 text-xs mt-1">{editFormErrors.location}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HR-1 <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={editFormData.hr1}
                      onChange={(e) => handleEditInputChange('hr1', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        editFormErrors.hr1 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select HR</option>
                      {hrs.map(hr => (
                        <option key={hr.id} value={hr.name}>{hr.name}</option>
                      ))}
                    </select>
                    {editFormErrors.hr1 && (
                      <p className="text-red-500 text-xs mt-1">{editFormErrors.hr1}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">HR-2</label>
                    <select 
                      value={editFormData.hr2}
                      onChange={(e) => handleEditInputChange('hr2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select HR</option>
                      {hrs.map(hr => (
                        <option key={hr.id} value={hr.name}>{hr.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager-1 <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={editFormData.manager1}
                    onChange={(e) => handleEditInputChange('manager1', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      editFormErrors.manager1 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Manager</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.name}>{manager.name}</option>
                    ))}
                  </select>
                  {editFormErrors.manager1 && (
                    <p className="text-red-500 text-xs mt-1">{editFormErrors.manager1}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager-2</label>
                    <select 
                      value={editFormData.manager2}
                      onChange={(e) => handleEditInputChange('manager2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Manager</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.name}>{manager.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager-3</label>
                    <select 
                      value={editFormData.manager3}
                      onChange={(e) => handleEditInputChange('manager3', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Manager</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.name}>{manager.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? (selectedEmployee.reassignment ? 'Reassigning...' : 'Assigning...') 
                      : (selectedEmployee.reassignment ? 'Reassign' : 'Assign')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isViewModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Employee Details</h2>
                <button
                  onClick={() => setIsViewModalOpen(false)}
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
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <div className="text-gray-900">{selectedEmployee.name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company Email</label>
                      <div className="text-gray-900">{selectedEmployee.company_email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Personal Email</label>
                      <div className="text-gray-900">{selectedEmployee.to_email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company Employee ID</label>
                      <div className="text-gray-900">
                        <span className="px-2 py-1 text-sm font-semibold text-blue-700 bg-blue-50 rounded">
                          {selectedEmployee.company_employee_id || 'Not Set'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Role</label>
                      <div className="text-gray-900">{selectedEmployee.designation}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Employment Type</label>
                      <div className="text-gray-900">{selectedEmployee.type}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="text-gray-900">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {selectedEmployee.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Reassignment Status</label>
                      <div className="text-gray-900">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedEmployee.reassignment ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedEmployee.reassignment ? 'Reassigned' : 'Initial Assignment'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <div className="text-gray-900">{selectedEmployee.location}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Joining</label>
                      <div className="text-gray-900">{selectedEmployee.dateOfJoining || 'Not Set'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">HR</label>
                      <div className="text-gray-900">{selectedEmployee.hr}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Managers</label>
                      <div className="text-gray-900">{selectedEmployee.managers}</div>
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

export default EmployeeManagement;