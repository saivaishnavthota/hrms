import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { projectAllocationAPI, projectsAPI } from '@/lib/api';

const ProjectAllocations = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [creatingDefaults, setCreatingDefaults] = useState(false);

  // Generate month options (current year and next year)
  const currentYear = new Date().getFullYear();
  const monthOptions = [];
  for (let year = currentYear; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      monthOptions.push({ value: monthStr, label: monthName });
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject && selectedMonth) {
      fetchProjectAllocations();
    }
  }, [selectedProject, selectedMonth]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects();
      const projectsData = Array.isArray(response) ? response : [];
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectAllocations = async () => {
    try {
      setLoading(true);
      const response = await projectAllocationAPI.getProjectAllocations(selectedProject, selectedMonth);
      setAllocations(response.allocations || []);
    } catch (error) {
      console.error('Error fetching allocations:', error);
      toast.error('Failed to fetch project allocations');
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setImportLoading(true);
      // Use a dummy project_id since the actual project will be extracted from Excel
      const response = await projectAllocationAPI.importAllocations(0, selectedFile);
      
      setImportResults(response);
      
      if (response.success) {
        toast.success(`Import completed! ${response.imported_count} allocations imported`);
        // Refresh allocations if we're viewing the same project/month
        if (selectedProject && selectedMonth) {
          fetchProjectAllocations();
        }
      } else {
        toast.error(response.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import allocations');
    } finally {
      setImportLoading(false);
    }
  };

  const createDefaultAllocations = async () => {
    setCreatingDefaults(true);
    try {
      const response = await projectAllocationAPI.createDefaultAllocationsForExisting();
      
      if (response.success) {
        toast.success(`Default allocations created! ${response.created} new, ${response.updated} updated`);
      } else {
        toast.error(response.message || 'Failed to create default allocations');
      }
    } catch (error) {
      console.error('Create default allocations error:', error);
      toast.error(error.response?.data?.message || 'Failed to create default allocations');
    } finally {
      setCreatingDefaults(false);
    }
  };

  const downloadTemplate = () => {
    // Create a simple template structure
    const templateData = {
      'No': [1, 2],
      'Name': ['John Doe', 'Jane Smith'],
      'Company Name': ['YTPL', 'YTPL'],
      'Band': ['L1', 'L2'],
      'Account': ['UKPN', 'UKPN'],
      'Project Name(Revenue)': ['Sample Project', 'Sample Project'],
      'Project Name (Commercial)': ['Sample Project Commercial', 'Sample Project Commercial'],
      'India-Location': ['Hyderabad', 'Hyderabad'],
      'Location': ['OFFSHORE', 'OFFSHORE'],
      'Nov-25': [18, 18],
      'Dec-25': [18, 18],
      'YTPL Emp ID': [12345, 67890],
      'Title': ['Developer', 'Manager']
    };

    // Convert to CSV format
    const headers = Object.keys(templateData);
    const rows = templateData[headers[0]].map((_, index) => 
      headers.map(header => templateData[header][index]).join(',')
    );
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Download as CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project_allocation_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Allocations</h1>
            <p className="text-gray-600 mt-1">Manage project allocations and import from Excel</p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Excel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Import Project Allocations
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Select Excel File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: .xlsx, .xls (Max 10MB)
                    </p>
                    <p className="text-sm text-[#2D5016] mt-1">
                      ℹ️ Project information will be extracted from the Excel file automatically
                    </p>
                  </div>
                  
                  {selectedFile && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-[#2D5016]" />
                        <span className="text-sm font-medium text-green-800">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-[#2D5016]">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleImport} 
                      disabled={!selectedFile || importLoading}
                      className="flex-1"
                    >
                      {importLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import Allocations
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsImportOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Import Results */}
        {importResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResults.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className={importResults.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{importResults.message}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Imported:</span> {importResults.imported_count || 0}
                      </div>
                      <div>
                        <span className="font-medium">Errors:</span> {importResults.error_count || 0}
                      </div>
                    </div>
                    {importResults.error_details && importResults.error_details.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-sm">Error Details:</p>
                        <ul className="text-xs space-y-1 mt-1">
                          {importResults.error_details.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-red-600">• {error}</li>
                          ))}
                          {importResults.error_details.length > 5 && (
                            <li className="text-gray-500">... and {importResults.error_details.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="view" className="space-y-6">
          <TabsList>
            <TabsTrigger value="view">View Allocations</TabsTrigger>
            <TabsTrigger value="import">Import History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Project Allocations</CardTitle>
                  <Button 
                    onClick={createDefaultAllocations}
                    disabled={creatingDefaults}
                    className="bg-[#2D5016] hover:bg-green-700"
                  >
                    {creatingDefaults ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Create Default Allocations
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <Label htmlFor="project-filter">Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.project_id} value={project.project_id.toString()}>
                            {project.project_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor="month-filter">Month</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a month" />
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
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={fetchProjectAllocations} 
                      disabled={!selectedProject || !selectedMonth || loading}
                      variant="outline"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading allocations...
                  </div>
                ) : allocations.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Band</TableHead>
                          <TableHead>Allocated Days</TableHead>
                          <TableHead>Consumed Days</TableHead>
                          <TableHead>Remaining Days</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Service Line</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocations.map((allocation, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {allocation.employee_name}
                            </TableCell>
                            <TableCell>{allocation.company || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{allocation.level || '-'}</Badge>
                            </TableCell>
                            <TableCell>{allocation.allocated_days}</TableCell>
                            <TableCell>{allocation.consumed_days}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={allocation.remaining_days > 0 ? "default" : "destructive"}
                              >
                                {allocation.remaining_days}
                              </Badge>
                            </TableCell>
                            <TableCell>{allocation.client || '-'}</TableCell>
                            <TableCell>{allocation.service_line || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No allocations found for the selected project and month.</p>
                    <p className="text-sm mt-1">Try importing Excel data or select a different project/month.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Excel File Format</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Your Excel file should have the following columns in order. Projects will be created automatically from the Excel data:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        <div>No</div>
                        <div>Name</div>
                        <div>Company Name</div>
                        <div>Band</div>
                        <div>Account</div>
                        <div>Project Name(Revenue)</div>
                        <div>Project Name (Commercial)</div>
                        <div>India-Location</div>
                        <div>Location</div>
                        <div>Nov-25, Dec-25, etc.</div>
                        <div>YTPL Emp ID</div>
                        <div>Title</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Important Notes</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Employee names must match existing employees in the system</li>
                      <li>• Month columns should be in format "Nov-25", "Dec-25", etc.</li>
                      <li>• Allocation days should be numeric values (0-30)</li>
                      <li>• <strong>Projects will be created automatically</strong> from the "Project Name(Revenue)" column</li>
                      <li>• Employee information will be updated with company details</li>
                      <li>• <strong>No need to select a project</strong> - everything is extracted from Excel</li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={downloadTemplate} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectAllocations;
