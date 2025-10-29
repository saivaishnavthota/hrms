import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Calendar,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileSpreadsheet,
  User,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { projectAllocationAPI, userAPI } from '@/lib/api';
import api from '@/lib/api';

// Get current user function - same as Manager/Employees
const getCurrentUser = () => {
  try {
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    const authToken = localStorage.getItem('authToken');
    return { userId: userId ? Number(userId) : null, userType, authToken };
  } catch (e) {
    return { userId: null, userType: null, authToken: null };
  }
}; 

const EmployeeAllocationDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeData, setEmployeeData] = useState(null);
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({
    startMonth: '',
    endMonth: ''
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Generate month options (current year and next year)
  const currentYear = new Date().getFullYear();
  const monthOptions = [];

  // Get unique project names from allocations
  const getUniqueProjects = () => {
    const projects = new Set();
    Object.values(allocations).forEach(monthAllocations => {
      monthAllocations.forEach(allocation => {
        if (allocation.project_name) {
          projects.add(allocation.project_name);
        }
      });
    });
    return Array.from(projects).sort();
  };

  const uniqueProjects = getUniqueProjects();
  for (let year = currentYear; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      monthOptions.push({ value: monthStr, label: monthName });
    }
  }

  useEffect(() => {
    // Get current user using same method as Manager/Employees
    const user = getCurrentUser();
    if (user.userId) {
      setCurrentUser(user);
      console.log('Current user:', user);
      console.log('User ID:', user.userId);
      console.log('User Type:', user.userType);
    } else {
      console.error('No user data found in localStorage');
      console.log('Available localStorage keys:', Object.keys(localStorage));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchEmployees();
    }
  }, [currentUser]);

  useEffect(() => {
    if (employees && employees.length > 0) {
      fetchAllEmployeesAllocations();
    }
  }, [employees, dateRange]);

  const fetchEmployees = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      // Use userId from getCurrentUser() - same as Manager/Employees
      const managerId = currentUser.userId;
      console.log('Fetching employees for manager:', managerId);
      console.log('Available user fields:', Object.keys(currentUser));
      
      if (!managerId) {
        console.error('No manager ID found in user object');
        toast.error('Manager ID not found in user data');
        return;
      }
      
      // Use the manager-specific API endpoint - same pattern as Manager/Employees
      const { data: dataMgr } = await api.get(`/projects/manager-employees?manager_id=${managerId}`);
      console.log('Manager employees API Response:', dataMgr);
      
      // Handle the response structure - same logic as Manager/Employees
      const mgrEmployees = Array.isArray(dataMgr?.employees) ? dataMgr.employees : (Array.isArray(dataMgr) ? dataMgr : []);
      
      console.log('Processed manager employees data:', mgrEmployees);
      setEmployees(mgrEmployees);
    } catch (error) {
      console.error('Error fetching manager employees:', error);
      toast.error('Failed to fetch assigned employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployeesAllocations = async () => {
    if (!employees || employees.length === 0) return;

    try {
      setLoading(true);
      console.log('Fetching allocations for all employees:', employees.length);
      
      // Fetch allocations for all employees in parallel
      const allocationPromises = employees.map(async (employee) => {
        try {
          const response = await projectAllocationAPI.getEmployeeAllocations(
            employee.id,
            dateRange.startMonth || undefined,
            dateRange.endMonth || undefined
          );
          return {
            employeeId: employee.id,
            employeeName: employee.name,
            employeeEmail: employee.email,
            allocations: response.allocations_by_month || {}
          };
        } catch (error) {
          console.error(`Error fetching allocations for employee ${employee.id}:`, error);
          return {
            employeeId: employee.id,
            employeeName: employee.name,
            employeeEmail: employee.email,
            allocations: {}
          };
        }
      });

      const allAllocations = await Promise.all(allocationPromises);
      console.log('All employees allocations:', allAllocations);
      
      // Group all allocations by month
      const groupedAllocations = {};
      allAllocations.forEach(employeeData => {
        Object.entries(employeeData.allocations).forEach(([month, allocations]) => {
          if (!groupedAllocations[month]) {
            groupedAllocations[month] = [];
          }
          // Add employee info to each allocation
          allocations.forEach(allocation => {
            groupedAllocations[month].push({
              ...allocation,
              employee_id: employeeData.employeeId,
              employee_name: employeeData.employeeName,
              employee_email: employeeData.employeeEmail
            });
          });
        });
      });

      setAllocations(groupedAllocations);
    } catch (error) {
      console.error('Error fetching all employees allocations:', error);
      toast.error('Failed to fetch team allocations');
      setAllocations({});
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = Array.isArray(employees) ? employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Pagination logic
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);


  const getMonthColumns = () => {
    const months = Object.keys(allocations).sort();
    return months.map(month => {
      const [year, monthNum] = month.split('-');
      const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'short' });
      return {
        key: month,
        label: `${monthName}-${year.slice(-2)}`,
        fullLabel: `${monthName} ${year}`
      };
    });
  };

  const getTotalAllocationForMonth = (month) => {
    const monthAllocations = allocations[month] || [];
    return monthAllocations.reduce((sum, alloc) => sum + alloc.allocated_days, 0);
  };

  const getTotalConsumedForMonth = (month) => {
    const monthAllocations = allocations[month] || [];
    return monthAllocations.reduce((sum, alloc) => sum + alloc.consumed_days, 0);
  };

  const exportToExcel = () => {
    if (!allocations || Object.keys(allocations).length === 0) return;

    const monthColumns = getMonthColumns();
    const csvData = [];

    // Headers
    const headers = [
      'Employee ID',
      'Employee Name',
      'Employee Email',
      'Project Name',
      'Client',
      ...monthColumns.map(col => col.label),
      'Total Allocated',
      'Total Consumed',
      'Remaining'
    ];
    csvData.push(headers.join(','));

    // Group allocations by employee and project
    const employeeProjectGroups = {};
    Object.entries(allocations).forEach(([month, monthAllocations]) => {
      monthAllocations.forEach(allocation => {
        const groupKey = `${allocation.employee_id}-${allocation.project_name}-${allocation.client}`;
        if (!employeeProjectGroups[groupKey]) {
          employeeProjectGroups[groupKey] = {
            employee_id: allocation.employee_id,
            employee_name: allocation.employee_name,
            employee_email: allocation.employee_email,
            project_name: allocation.project_name,
            project_id: allocation.project_id,
            company: allocation.company,
            client: allocation.client,
            months: {},
            total_allocated: 0,
            total_consumed: 0,
            total_remaining: 0
          };
        }
        employeeProjectGroups[groupKey].months[month] = allocation;
        employeeProjectGroups[groupKey].total_allocated += allocation.allocated_days;
        employeeProjectGroups[groupKey].total_consumed += allocation.consumed_days;
        employeeProjectGroups[groupKey].total_remaining += allocation.remaining_days;
      });
    });

    // Add data rows
    Object.values(employeeProjectGroups).forEach(group => {
      const row = [
        group.employee_id,
        group.employee_name,
        group.employee_email,
        group.project_name,
        group.client || '',
        ...monthColumns.map(col => group.months[col.key]?.allocated_days || ''),
        group.total_allocated,
        group.total_consumed,
        group.total_remaining
      ];
      csvData.push(row.join(','));
    });

    // Download CSV
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee-allocation-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-heading-md text-gray-700" style={{ fontFamily: 'Arial, sans-serif' }}>Employee Allocation Dashboard</h4>
            <p className="font-body-md text-gray-600 mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>View project allocations for all employees assigned to you</p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2" disabled={!allocations || Object.keys(allocations).length === 0}>
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
            
            <Button onClick={fetchAllEmployeesAllocations} variant="outline" className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>


        {/* Team Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="font-heading-md text-blue-600">
                  {searchTerm || (selectedProject && selectedProject !== 'all') ? 
                    employees.filter(emp => {
                      const matchesSearch = !searchTerm || 
                        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
                      return matchesSearch;
                    }).length 
                    : employees.length}
                </div>
                <div className="font-body-sm text-blue-700">
                  {searchTerm || (selectedProject && selectedProject !== 'all') ? 'Filtered Employees' : 'Total Employees'}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="font-heading-md text-green-600">
                  {(() => {
                    const employeesWithAllocations = new Set();
                    Object.values(allocations).forEach(monthAllocations => {
                      monthAllocations.forEach(allocation => {
                        employeesWithAllocations.add(allocation.employee_id);
                      });
                    });
                    return employeesWithAllocations.size;
                  })()}
                </div>
                <div className="font-body-sm text-green-700">With Allocations</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="font-heading-md text-orange-600">
                  {(() => {
                    const employeesWithAllocations = new Set();
                    Object.values(allocations).forEach(monthAllocations => {
                      monthAllocations.forEach(allocation => {
                        employeesWithAllocations.add(allocation.employee_id);
                      });
                    });
                    return employees.length - employeesWithAllocations.size;
                  })()}
                </div>
                <div className="font-body-sm text-orange-700">No Allocations</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="font-heading-md text-purple-600">
                  {(() => {
                    const uniqueProjects = new Set();
                    Object.values(allocations).forEach(monthAllocations => {
                      monthAllocations.forEach(allocation => {
                        uniqueProjects.add(`${allocation.project_name}-${allocation.client}`);
                      });
                    });
                    return uniqueProjects.size;
                  })()}
                </div>
                <div className="font-body-sm text-purple-700">Total Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date Range Filter (Optional)
            </CardTitle>
            <p className="font-body-sm text-gray-600">Leave empty to show all allocations, or select months to filter</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start-month">Start Month</Label>
                <Select value={dateRange.startMonth} onValueChange={(value) => setDateRange(prev => ({ ...prev, startMonth: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select start month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="end-month">End Month</Label>
                <Select value={dateRange.endMonth} onValueChange={(value) => setDateRange(prev => ({ ...prev, endMonth: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select end month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="employee-search">Search Employee</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="employee-search"
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="project-filter">Filter by Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {uniqueProjects.map(project => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Allocation Table */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading allocations...
            </CardContent>
          </Card>
        ) : Object.keys(allocations).length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Allocation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Client</TableHead>
                      {getMonthColumns().map((month) => (
                        <TableHead key={month.key} className="text-center">
                          {month.label}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Total Allocated</TableHead>
                      <TableHead className="text-center">Total Consumed</TableHead>
                      <TableHead className="text-center">Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Group allocations by employee and project
                      const employeeProjectGroups = {};
                      Object.entries(allocations).forEach(([month, monthAllocations]) => {
                        monthAllocations.forEach(allocation => {
                          // Filter by search term if provided
                          const matchesSearch = !searchTerm || 
                            allocation.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            allocation.employee_email?.toLowerCase().includes(searchTerm.toLowerCase());
                          
                          // Filter by project if provided
                          const matchesProject = !selectedProject || selectedProject === 'all' || 
                            allocation.project_name === selectedProject;
                          
                          if (!matchesSearch || !matchesProject) return;
                          
                          const groupKey = `${allocation.employee_id}-${allocation.project_name}-${allocation.client}`;
                          if (!employeeProjectGroups[groupKey]) {
                            employeeProjectGroups[groupKey] = {
                              employee_id: allocation.employee_id,
                              employee_name: allocation.employee_name,
                              employee_email: allocation.employee_email,
                              project_name: allocation.project_name,
                              company: allocation.company,
                              client: allocation.client,
                              months: {},
                              total_allocated: 0,
                              total_consumed: 0,
                              total_remaining: 0
                            };
                          }
                          employeeProjectGroups[groupKey].months[month] = allocation;
                          employeeProjectGroups[groupKey].total_allocated += allocation.allocated_days;
                          employeeProjectGroups[groupKey].total_consumed += allocation.consumed_days;
                          employeeProjectGroups[groupKey].total_remaining += allocation.remaining_days;
                        });
                      });

                      // Render grouped employee-project combinations
                      // Apply pagination to grouped data
                      const groupedValues = Object.values(employeeProjectGroups);
                      const paginatedGroups = groupedValues.slice(startIndex, endIndex);
                      
                      return paginatedGroups.map((group, index) => (
                        <TableRow key={`group-${index}`}>
                          <TableCell className="font-medium">
                            <div className="space-y-1">
                              <div className="font-md" style={{ fontFamily: '"Corporative Sans RD", Arial, sans-serif', fontSize: '18.4px' }}>{group.employee_name}</div>
                              <div className="text-xs text-gray-500">{group.employee_email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="font-semibold">{group.project_name}</div>
                          </TableCell>
                          <TableCell>{group.client || '-'}</TableCell>
                          {getMonthColumns().map((monthCol) => (
                            <TableCell key={monthCol.key} className="text-center">
                              {group.months[monthCol.key] ? (
                                <div className="space-y-1">
                                  <Badge variant="outline" className="text-xs">
                                    {group.months[monthCol.key].allocated_days}d allocated
                                  </Badge>
                                  <div className="text-xs text-gray-600">
                                    {group.months[monthCol.key].remaining_days}d remaining
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-subheading-sm">
                            <div className="space-y-1">
                              <div className="font-body-sm font-semibold">{group.total_allocated}.0 days</div>
                              <div className="text-xs text-gray-500">Total Allocated</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <Badge variant="secondary" className="text-xs">
                                {group.total_consumed}.0 days
                              </Badge>
                              <div className="text-xs text-gray-500">Total Consumed</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <Badge 
                                variant={group.total_remaining > 0 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {group.total_remaining}.0 days
                              </Badge>
                              <div className="text-xs text-gray-500">Remaining</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {(() => {
                const employeeProjectGroups = {};
                Object.entries(allocations).forEach(([month, monthAllocations]) => {
                  monthAllocations.forEach(allocation => {
                    const matchesSearch = !searchTerm || 
                      allocation.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      allocation.employee_email?.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    const matchesProject = !selectedProject || selectedProject === 'all' || 
                      allocation.project_name === selectedProject;
                    
                    if (!matchesSearch || !matchesProject) return;
                    
                    const groupKey = `${allocation.employee_id}-${allocation.project_name}-${allocation.client}`;
                    if (!employeeProjectGroups[groupKey]) {
                      employeeProjectGroups[groupKey] = { employee_name: allocation.employee_name };
                    }
                  });
                });
                
                const totalFilteredGroups = Object.keys(employeeProjectGroups).length;
                
                return totalFilteredGroups > 0 && (
                  <div className="flex items-center justify-between mt-6 px-4">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-700">Rows per page:</p>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger className="w-20">
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
                    
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-700">
                        Showing {startIndex + 1} to {Math.min(endIndex, totalFilteredGroups)} of {totalFilteredGroups} entries
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, Math.ceil(totalFilteredGroups / itemsPerPage)) }, (_, i) => {
                          const totalPages = Math.ceil(totalFilteredGroups / itemsPerPage);
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalFilteredGroups / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(totalFilteredGroups / itemsPerPage)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        ) : employees.length > 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {searchTerm ? 
                  `No allocation data found for employees matching "${searchTerm}".` : 
                  'No allocation data found for your team.'
                }
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm ? 
                  'Try adjusting your search term or date range.' : 
                  'Try adjusting the date range or contact HR for assistance.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No employees found in your team.</p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default EmployeeAllocationDashboard;
