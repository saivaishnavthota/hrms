import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  Eye, 
  Edit, 
  Copy, 
  Lock, 
  Trash2, 
  Search, 
  Filter, 
  UserPlus,
  MoreHorizontal,
  ChevronDown,
  X,
  User,
  Mail,
  Calendar,
  MapPin,
  Users
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { avatarBg } from '../../lib/avatarColors';


  const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [hrFilter, setHrFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [perPage, setPerPage] = useState('10');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    type: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const employmentTypes = ['Intern', 'Full-time', 'Contract'];
  const roles = ['Employee', 'HR', 'Manager', 'Account Manager'];

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    companyMail: '',
    dateOfJoining: '',
    location: '',
    hr1: '',
    hr2: '',
    manager1: '',
    manager2: '',
    manager3: ''
  });
  const [editErrors, setEditErrors] = useState({});

  // Fetch all required data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [employeesRes, managersRes, hrsRes, locationsRes] = await Promise.all([
        api.get('/users/employees'),
        api.get('/users/managers'),
        api.get('/users/hrs'),
        api.get('/locations/')
      ]);

      // Process employees data (supports multiple response shapes)
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
        employeeId: emp.employeeId ? `EMP${emp.employeeId}` : (emp.id ? `EMP${emp.id}` : ''),
        type: emp.type || 'Employee',
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
      console.error('Error fetching data:', err);
      console.error('Error details:', err.response?.data || err.message);
      toast.error("Failed to fetch data. Please try again.");

      
      
    } finally {
      setLoading(false);
    }
  };

  // Assignment functionality
  const handleAssignEmployee = async (employeeData) => {
    try {
      setIsSubmitting(true);
      
      const assignmentData = {
        employee_id: employeeData.employee_id,
        location_id: employeeData.location_id,
        manager_ids: employeeData.manager_ids, // Array of manager IDs
        hr_ids: employeeData.hr_ids // Array of HR IDs
      };

      const response = await api.post('/hr/assign', assignmentData);
      
      if (response.status === 200) {
        toast.success('Employee assigned successfully!');
        // Refresh the employee list
        await fetchAllData();
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.log(employeeData);
      console.error('Error assigning employee:', err);
      toast.error('Failed to assign employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.type) {
      newErrors.type = 'Employment type is required';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/onboarding/hr/create_employee", formData);

      toast.success("Employee created successfully!");

      setFormData({ name: "", email: "", role: "", type: "" });
      setIsModalOpen(false);

      await fetchAllData();
    } catch (err) {
      console.error("Error creating employee:", err.response?.data || err.message);
      toast.error(
        "Error creating employee: " + (err.response?.data?.detail || "Unknown error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: '',
      email: '',
      role: '',
      type: ''
    });
    setErrors({});
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    
    // Parse assigned HR and managers from the employee data
    const assignedHRs = employee.hr && employee.hr !== 'Not Assigned' ? employee.hr.split(', ') : [];
    const assignedManagers = employee.managers && employee.managers !== 'Not Assigned' ? employee.managers.split(', ') : [];
   

    setEditFormData({
      fullName: employee.name || '',
      companyMail: employee.company_email || '',
      dateOfJoining: employee.dateOfJoining || '',
      location: employee.location,
      hr1: assignedHRs[0] || '',
      hr2: assignedHRs[1] || '',
      manager1: assignedManagers[0] || '',
      manager2: assignedManagers[1] || '',
      manager3: assignedManagers[2] || ''
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedEmployee(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
    setEditFormData({
      fullName: '',
      companyMail: '',
      dateOfJoining: '',
      location: '',
      hr1: '',
      hr2: '',
      manager1: '',
      manager2: '',
      manager3: ''
    });
    setEditErrors({});
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (editErrors[field]) {
      setEditErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateEditForm = () => {
    const newErrors = {};
    
    if (!editFormData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!editFormData.companyMail.trim()) {
      newErrors.companyMail = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(editFormData.companyMail)) {
      newErrors.companyMail = 'Please enter a valid email address';
    }
    
    if (!editFormData.dateOfJoining) {
      newErrors.dateOfJoining = 'Date of joining is required';
    }
    
    if (!editFormData.location) {
      newErrors.location = 'Location is required';
    }
    
    if (!editFormData.hr1) {
      newErrors.hr1 = 'HR-1 is required';
    }
    
    if (!editFormData.manager1) {
      newErrors.manager1 = 'Manager-1 is required';
    }
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Find the IDs for selected managers and HRs
      const hr1Id = hrs.find(hr => hr.name === editFormData.hr1)?.id;
      const hr2Id = hrs.find(hr => hr.name === editFormData.hr2)?.id;
      const manager1Id = managers.find(manager => manager.name === editFormData.manager1)?.id;
      const manager2Id = managers.find(manager => manager.name === editFormData.manager2)?.id;
      const manager3Id = managers.find(manager => manager.name === editFormData.manager3)?.id;
      const locationId = locations.find(location => location.name === editFormData.location)?.id;
      
      // Prepare request body in the format expected by backend
      const requestBody = {
        employee_id: selectedEmployee?.id || 0,
        location_id: locationId || 0,
        doj: editFormData.dateOfJoining,
        to_email: selectedEmployee?.to_email,
        company_email: editFormData.companyMail,
        manager1_id: manager1Id || null,
        manager2_id: manager2Id || null,
        manager3_id: manager3Id || null,
        hr1_id: hr1Id || null,
        hr2_id: hr2Id || null
      };
      
      console.log('Sending request body:', requestBody);
      
     toast.success("Employee assigned successfully!");
      await fetchAllData();
      closeEditModal();
    } catch (err) {
      console.error("Error assigning employee:", err.response?.data || err.message);
      toast.error(
        "Error assigning employee: " + (err.response?.data?.detail || "Unknown error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getAvatarColor = (name) => avatarBg(name);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || employee.type?.toLowerCase() === typeFilter.toLowerCase();
    const matchesLocation = locationFilter === 'all' || employee.location === locationFilter;
    const matchesHr = hrFilter === 'all' || employee.hr === hrFilter;
    const matchesManager = managerFilter === 'all' || employee.managers?.includes(managerFilter);
    
    return matchesSearch && matchesStatus && matchesType && matchesLocation && matchesHr && matchesManager;
  });

  const ActionButton = ({ onClick, variant = "ghost", size = "sm", className = "" }) => (
    <Button
      variant={variant}
      size={size}
      mode="icon"
      onClick={onClick}
      className={`h-8 w-8 p-0 ${className}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
        <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">  
        <div className="flex items-center justify-between gap-4">  
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, ID, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant={showFilters ? "default" : "outline"} 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(statusFilter !== 'all' || typeFilter !== 'all' || locationFilter !== 'all' || hrFilter !== 'all' || managerFilter !== 'all') && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {[statusFilter, typeFilter, locationFilter, hrFilter, managerFilter].filter(f => f !== 'all').length}
                </Badge>
              )}
            </Button>
          </div>
         
          <div className="flex items-center gap-4"> 
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" mode="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" mode="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600"> 
              <span>Per Page:</span>
              <Select value={perPage} onValueChange={setPerPage}>
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4"> 
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Filter Options</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setLocationFilter('all');
                  setHrFilter('all');
                  setManagerFilter('all');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"> 
              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Employment Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {employmentTypes.map(type => (
                      <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.name}>{location.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* HR Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Assigned HR</Label>
                <Select value={hrFilter} onValueChange={setHrFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All HRs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All HRs</SelectItem>
                    {hrs.map(hr => (
                      <SelectItem key={hr.id} value={hr.name}>{hr.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manager Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Manager</Label>
                <Select value={managerFilter} onValueChange={setManagerFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Managers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                    {managers.map(manager => (
                      <SelectItem key={manager.id} value={manager.name}>{manager.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div> 
          </div> 
        )}
      </div> 

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12 text-center">S.No</TableHead>
              <TableHead>Employee Details</TableHead>
              <TableHead>EmpID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>HR</TableHead>
              <TableHead>Managers</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee, index) => (
              <TableRow key={employee.id} className="hover:bg-gray-50">
                <TableCell className="text-center font-medium">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center text-white font-medium text-sm`}>
                      {employee.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.company_email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-900 font-medium">{employee.employeeId}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-900">{employee.type}</span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="success" 
                    appearance="light" 
                    size="sm"
                    className="text-green-700 bg-green-100"
                  >
                    {employee.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-gray-900">{employee.hr}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-900">{employee.managers}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <ActionButton 
                      icon={Eye} 
                      onClick={() => handleViewEmployee(employee)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    />
                    <ActionButton 
                      icon={Edit} 
                      onClick={() => handleEditEmployee(employee)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    />
                   
            
                    <ActionButton 
                      icon={Trash2} 
                      onClick={() => console.log('Delete', employee.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Showing {filteredEmployees.length} of {employees.length} entries</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disab led>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-blue-500 text-white border-blue-500">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">  
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-md mx-4"> 
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add New Employee</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`mt-1 pl-10 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Enter employee name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`mt-1 pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                  Employment Type
                </Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className={`mt-1 ${errors.type ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger className={`mt-1 ${errors.role ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>  
        </div> 
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center p-4 z-50">  
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Edit Employee</h2>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-primary/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-primary/70 hover:text-primary" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="fullName"
                      type="text"
                      value={editFormData.fullName}
                      onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                      className={`mt-1 pl-10 ${editErrors.fullName ? 'border-red-500' : ''}`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {editErrors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.fullName}</p>
                  )}
                </div>

                {/* Employee ID */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Employee ID
                  </Label>
                  <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <span className="text-sm font-mono text-blue-800">
                      {selectedEmployee ? selectedEmployee.employeeId || 'EMP-' + String(selectedEmployee.id).padStart(4, '0') : 'EMP-0001'}
                    </span>
                    <p className="text-xs text-blue-600 mt-1">Auto-generated when employee is created</p>
                  </div>
                </div>

                {/* Company Mail */}
                <div>
                  <Label htmlFor="companyMail" className="text-sm font-medium text-gray-700">
                    Company Mail <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="companyMail"
                      type="email"
                      value={editFormData.companyMail}
                      onChange={(e) => handleEditInputChange('companyMail', e.target.value)}
                      className={`mt-1 pl-10 ${editErrors.companyMail ? 'border-red-500' : ''}`}
                      placeholder="Enter company email"
                    />
                  </div>
                  {editErrors.companyMail && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.companyMail}</p>
                  )}
                </div>

                {/* Date of Joining */}
                <div>
                  <Label htmlFor="dateOfJoining" className="text-sm font-medium text-gray-700">
                    Date of Joining <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="dateOfJoining"
                      type="date"
                      value={editFormData.dateOfJoining}
                      onChange={(e) => handleEditInputChange('dateOfJoining', e.target.value)}
                      className={`mt-1 pl-10 ${editErrors.dateOfJoining ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {editErrors.dateOfJoining && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.dateOfJoining}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Select value={editFormData.location} onValueChange={(value) => handleEditInputChange('location', value)}>
                    <SelectTrigger className={`mt-1 ${editErrors.location ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.name}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editErrors.location && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.location}</p>
                  )}
                </div>

                {/* HR Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hr1" className="text-sm font-medium text-gray-700">
                      HR-1 <span className="text-red-500">*</span>
                    </Label>
                    <Select value={editFormData.hr1} onValueChange={(value) => handleEditInputChange('hr1', value)}>
                      <SelectTrigger className={`mt-1 ${editErrors.hr1 ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select HR-1" />
                      </SelectTrigger>
                      <SelectContent>
                        {hrs.map((hr) => (
                          <SelectItem key={hr.id} value={hr.name}>
                            {hr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editErrors.hr1 && (
                      <p className="text-red-500 text-xs mt-1">{editErrors.hr1}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="hr2" className="text-sm font-medium text-gray-700">
                      HR-2
                    </Label>
                    <Select value={editFormData.hr2} onValueChange={(value) => handleEditInputChange('hr2', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select HR-2" />
                      </SelectTrigger>
                      <SelectContent>
                           {hrs.map((hr) => (
                             <SelectItem key={hr.id} value={hr.name}>
                               {hr.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Manager Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="manager1" className="text-sm font-medium text-gray-700">
                      Manager-1 <span className="text-red-500">*</span>
                    </Label>
                    <Select value={editFormData.manager1} onValueChange={(value) => handleEditInputChange('manager1', value)}>
                      <SelectTrigger className={`mt-1 ${editErrors.manager1 ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Manager-1" />
                      </SelectTrigger>
                      <SelectContent>
                           {managers.map((manager) => (
                             <SelectItem key={manager.id} value={manager.name}>
                               {manager.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                    </Select>
                    {editErrors.manager1 && (
                      <p className="text-red-500 text-xs mt-1">{editErrors.manager1}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manager2" className="text-sm font-medium text-gray-700">
                        Manager-2
                      </Label>
                      <Select value={editFormData.manager2} onValueChange={(value) => handleEditInputChange('manager2', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select Manager-2" />
                        </SelectTrigger>
                        <SelectContent>
                           {managers.map((manager) => (
                             <SelectItem key={manager.id} value={manager.name}>
                               {manager.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="manager3" className="text-sm font-medium text-gray-700">
                        Manager-3
                      </Label>
                      <Select value={editFormData.manager3} onValueChange={(value) => handleEditInputChange('manager3', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select Manager-3" />
                        </SelectTrigger>
                        <SelectContent>
                           {managers.map((manager) => (
                             <SelectItem key={manager.id} value={manager.name}>
                               {manager.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 pt-4 border-t border-primary/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEditModal}
                    className="flex-1 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Assigning...' : 'Update Employee'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {isViewModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Employee Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeViewModal}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Employee Basic Info */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${getAvatarColor(selectedEmployee.name)} flex items-center justify-center text-white font-medium`}>
                      {selectedEmployee.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedEmployee.name}</div>
                      <div className="text-sm text-gray-500">{selectedEmployee.employeeId}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company Email</label>
                    <div className="text-gray-900">{selectedEmployee.company_email || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Personal Email</label>
                    <div className="text-gray-900">{selectedEmployee.to_email || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Employment Type</label>
                    <div className="text-gray-900">{selectedEmployee.type}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Designation</label>
                    <div className="text-gray-900">{selectedEmployee.designation}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div>
                      <Badge 
                        variant="success" 
                        appearance="light" 
                        size="sm"
                        className="text-green-700 bg-green-100"
                      >
                        {selectedEmployee.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <div className="text-gray-900">{selectedEmployee.location || 'Not Assigned'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date of Joining</label>
                    <div className="text-gray-900">{selectedEmployee.dateOfJoining || 'Not Available'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Joined Date</label>
                    <div className="text-gray-900">{selectedEmployee.joinedDate}</div>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Assigned HR</label>
                    <div className="text-gray-900">{selectedEmployee.hr}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Assigned Managers</label>
                    <div className="text-gray-900">{selectedEmployee.managers}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Document Count</label>
                    <div className="text-gray-900">{selectedEmployee.document_count} documents</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
              <Button
                variant="outline"
                onClick={closeViewModal}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default EmployeeManagement;

