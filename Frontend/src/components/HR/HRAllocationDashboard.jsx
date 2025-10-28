import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';

const getCurrentUser = () => {
  try {
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    const authToken = localStorage.getItem('authToken');
    const superHr = localStorage.getItem('superHr') === 'true';
    return { userId: userId ? Number(userId) : null, userType, authToken, superHr };
  } catch (e) {
    return { userId: null, userType: null, authToken: null, superHr: false };
  }
};

const HRAllocationDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Generate month options - extended to Jun 2027
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    const endDate = new Date(2027, 5, 1); // Jun 2027 (month is 0-indexed)
    
    // Generate months from Jun 2027 back to current date
    let date = new Date(endDate);
    while (date >= currentDate) {
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
      const displayStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push({ value: monthStr, label: displayStr });
      date.setMonth(date.getMonth() - 1);
    }
    return months;
  };

  const monthOptions = generateMonthOptions();

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

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user.userId) {
      fetchAllEmployees();
    }
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchAllEmployeesAllocations();
    }
  }, [employees, startMonth, endMonth]);

  const fetchAllEmployees = async () => {
    try {
      setLoading(true);
      // HR gets all employees
      const response = await api.get('/users/employees');
      const employeesData = Array.isArray(response.data?.employees) 
        ? response.data.employees 
        : (Array.isArray(response.data) ? response.data : []);
      
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployeesAllocations = async () => {
    try {
      setLoading(true);
      
      // Use the new bulk allocation API for better performance
      const employeeIds = employees.map(emp => emp.employeeId);
      
      if (employeeIds.length === 0) {
        setAllocations({});
        return;
      }
      
      // Create bulk allocation request
      const bulkRequest = {
        employee_ids: employeeIds,
        start_month: startMonth || null,
        end_month: endMonth || null,
        batch_size: 100 // Process 100 employees at a time
      };
      
      console.log(`Creating bulk allocation request for ${employeeIds.length} employees`);
      
      // Submit bulk request
      const response = await api.post('/api/bulk-allocations', bulkRequest);
      const requestId = response.data.request_id;
      
      console.log(`Bulk request created: ${requestId}`);
      
      // Poll for completion
      await pollBulkRequestStatus(requestId);
      
    } catch (error) {
      console.error('Error fetching allocations:', error);
      
      // Fallback to individual requests if bulk API fails
      console.log('Falling back to individual requests...');
      await fetchAllocationsFallback();
    } finally {
      setLoading(false);
    }
  };

  const pollBulkRequestStatus = async (requestId) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await api.get(`/api/bulk-allocations/${requestId}`);
        const status = response.data;
        
        console.log(`Bulk request status: ${status.status} (${status.completed_requests}/${status.total_requests})`);
        
        if (status.status === 'completed') {
          // Get results
          const resultsResponse = await api.get(`/api/bulk-allocations/${requestId}/results`);
          const results = resultsResponse.data.results;
          
          // Process results into grouped allocations
          const groupedAllocations = {};
          results.forEach(result => {
            if (result.status === 'success' && Array.isArray(result.allocations)) {
              result.allocations.forEach(allocation => {
                const month = allocation.month;
                if (!groupedAllocations[month]) {
                  groupedAllocations[month] = [];
                }
                groupedAllocations[month].push(allocation);
              });
            }
          });
          
          setAllocations(groupedAllocations);
          console.log(`Bulk request completed successfully. Processed ${results.length} employees.`);
          return;
          
        } else if (status.status === 'failed') {
          throw new Error('Bulk request failed');
        }
        
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
        
      } catch (error) {
        console.error('Error polling bulk request status:', error);
        throw error;
      }
    }
    
    throw new Error('Bulk request timeout');
  };

  const fetchAllocationsFallback = async () => {
    // Fallback method using optimized batching
    const batchSize = 20; // Smaller batches for fallback
    const batches = [];
    
    for (let i = 0; i < employees.length; i += batchSize) {
      batches.push(employees.slice(i, i + batchSize));
    }
    
    const allAllocations = [];
    
    // Process each batch sequentially with delays
    for (const batch of batches) {
      const batchPromises = batch.map(async (employee) => {
        try {
          const params = {};
          if (startMonth && endMonth) {
            params.start_month = startMonth;
            params.end_month = endMonth;
          }
          
          const response = await api.get(`/api/allocations/employee/${employee.employeeId}`, {
            params
          });
          return response.data;
        } catch (error) {
          console.error(`Error fetching allocations for employee ${employee.employeeId}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      allAllocations.push(...batchResults);
      
      // Delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Group allocations by month
    const groupedAllocations = {};
    allAllocations.forEach(employeeAllocations => {
      if (Array.isArray(employeeAllocations)) {
        employeeAllocations.forEach(allocation => {
          const month = allocation.month;
          if (!groupedAllocations[month]) {
            groupedAllocations[month] = [];
          }
          groupedAllocations[month].push(allocation);
        });
      }
    });

    setAllocations(groupedAllocations);
  };

  const exportToExcel = () => {
    if (!allocations || Object.keys(allocations).length === 0) {
      toast.error('No data to export');
      return;
    }

    // Group allocations by employee and project
    const employeeProjectGroups = {};
    Object.values(allocations).forEach(monthAllocations => {
      monthAllocations.forEach(allocation => {
        const key = `${allocation.employee_id}-${allocation.project_name}-${allocation.client}`;
        if (!employeeProjectGroups[key]) {
          employeeProjectGroups[key] = {
            employee_name: allocation.employee_name,
            employee_email: allocation.employee_email,
            project_name: allocation.project_name,
            client: allocation.client,
            months: {}
          };
        }
        employeeProjectGroups[key].months[allocation.month] = {
          allocated: allocation.allocated_days,
          remaining: allocation.remaining_days
        };
      });
    });

    // Create CSV data
    const months = Object.keys(allocations).sort();
    const headers = ['Employee', 'Project Name', 'Client', ...months.map(m => `${m} Allocated`), ...months.map(m => `${m} Remaining`)];
    
    const csvData = Object.values(employeeProjectGroups).map(group => {
      const row = [
        group.employee_name,
        group.project_name,
        group.client
      ];
      
      months.forEach(month => {
        const monthData = group.months[month];
        row.push(monthData ? monthData.allocated : '');
        row.push(monthData ? monthData.remaining : '');
      });
      
      return row;
    });

    // Convert to CSV
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee-allocation-dashboard-${startMonth}-to-${endMonth}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  // Reset to first page when search term or project filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProject]);

  // Group allocations by employee and project for display
  const employeeProjectGroups = {};
  Object.values(allocations).forEach(monthAllocations => {
    monthAllocations.forEach(allocation => {
      const key = `${allocation.employee_id}-${allocation.project_name}-${allocation.client}`;
      if (!employeeProjectGroups[key]) {
        employeeProjectGroups[key] = {
          employee_name: allocation.employee_name,
          employee_email: allocation.employee_email,
          project_name: allocation.project_name,
          client: allocation.client,
          months: {},
          total_allocated: 0
        };
      }
      employeeProjectGroups[key].months[allocation.month] = {
        allocated: allocation.allocated_days,
        remaining: allocation.remaining_days
      };
      employeeProjectGroups[key].total_allocated += allocation.allocated_days || 0;
    });
  });

  // Filter groups based on search term and selected project
  const filteredGroups = Object.values(employeeProjectGroups).filter(group => {
    const matchesSearch = group.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.employee_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // If a project is selected, check if this group matches the selected project
    if (selectedProject && selectedProject !== 'all') {
      return group.project_name === selectedProject;
    }
    
    return true;
  });

  // Pagination logic
  const totalItems = filteredGroups.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Apply pagination to filtered groups
  const paginatedGroups = filteredGroups.slice(startIndex, endIndex);

  // Filter months based on date range selection
  const allMonths = Object.keys(allocations).sort();
  const months = allMonths.filter(month => {
    // If no date filters are selected, show all months
    if (!startMonth && !endMonth) {
      return true;
    }
    
    // If only start month is selected, show months >= startMonth
    if (startMonth && !endMonth) {
      return month >= startMonth;
    }
    
    // If only end month is selected, show months <= endMonth
    if (!startMonth && endMonth) {
      return month <= endMonth;
    }
    
    // If both are selected, show months between startMonth and endMonth (inclusive)
    if (startMonth && endMonth) {
      return month >= startMonth && month <= endMonth;
    }
    
    return true;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-heading-md text-gray-700" style={{ fontFamily: 'Arial, sans-serif' }}>Employee Allocation Dashboard</h4>
            <p className="font-body-md text-gray-600 mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>
              {currentUser?.superHr 
                ? 'View project allocations for all employees across the organization' 
                : 'View project allocations for all employees'
              }
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2" disabled={!allocations || Object.keys(allocations).length === 0}>
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
          </div>
        </div>

        {/* Team Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-subheading-lg">Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="font-heading-md text-blue-600">
                  {searchTerm || (selectedProject && selectedProject !== 'all') ? 
                    filteredGroups.length 
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
            <CardTitle className="font-subheading-lg">Date Range Filter (Optional)</CardTitle>
            <p className="font-body-sm text-gray-600">Leave empty to show all allocations, or select months to filter</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="start-month" className="font-subheading-sm">Start Month</Label>
                <Select value={startMonth} onValueChange={setStartMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select start month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="end-month" className="font-subheading-sm">End Month</Label>
                <Select value={endMonth} onValueChange={setEndMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select end month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="search-employee" className="font-subheading-sm">Search Employee</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search-employee"
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="project-filter" className="font-subheading-sm">Filter by Project</Label>
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

        {/* Monthly Allocation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="font-subheading-lg">Monthly Allocation Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="font-body-md text-gray-600">Loading allocation data...</div>
              </div>
            ) : paginatedGroups.length === 0 ? (
              <div className="text-center py-8">
                <div className="font-body-md text-gray-600">
                  {searchTerm ? 'No employees found matching your search criteria' : 'No allocation data available'}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-subheading-sm">Employee</TableHead>
                      <TableHead className="font-subheading-sm">Project Name</TableHead>
                      <TableHead className="font-subheading-sm">Client</TableHead>
                      {months.map(month => (
                        <TableHead key={month} className="font-subheading-sm text-center">
                          {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </TableHead>
                      ))}
                      <TableHead className="font-subheading-sm text-center">Total Allocated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedGroups.map((group, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-body-md">
                          <div>
                            <div className="text-sm font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>{group.employee_name}</div>
                            <div className="text-sm text-gray-500">{group.employee_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-body-md">{group.project_name}</TableCell>
                        <TableCell className="font-body-md">{group.client}</TableCell>
                        {months.map(month => (
                          <TableCell key={month} className="text-center">
                            {group.months[month] ? (
                              <div className="space-y-1">
                                <div className="font-body-sm font-medium text-green-600">
                                  {group.months[month].allocated}d allocated
                                </div>
                                <div className="font-body-sm text-gray-500">
                                  {group.months[month].remaining}d remaining
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredGroups.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-4">
                <div className="flex items-center space-x-2">
                  <p className="font-body-sm text-gray-700">Rows per page:</p>
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
                  <p className="font-body-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRAllocationDashboard;