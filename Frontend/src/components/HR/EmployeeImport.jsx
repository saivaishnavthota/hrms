import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, Download, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { employeeImportAPI } from '@/lib/api';
// Simple toast implementation without external dependencies
const toast = {
  success: (message) => {
    // You can replace this with your preferred toast implementation
    alert(`✅ ${message}`);
  },
  error: (message) => {
    alert(`❌ ${message}`);
  }
};

const EmployeeImport = ({ onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setImportLoading(true);
      
      const result = await employeeImportAPI.importEmployees(selectedFile);
      
      setImportResults(result);
      
      if (result.success) {
        toast.success(`Import completed! ${result.imported} new employees, ${result.updated} updated`);
        setSelectedFile(null);
        setIsDialogOpen(false);
        // Call the callback if provided
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Error importing file');
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await employeeImportAPI.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error downloading template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Import</h1>
          <p className="text-gray-600">Bulk import employees from Excel file</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Employees
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Import Employees
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
              </div>
              
              {selectedFile && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{selectedFile.name}</p>
                      <p className="text-sm text-blue-700">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
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
                      Import Employees
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={importLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResults.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResults.imported || 0}
                  </div>
                  <div className="text-sm text-gray-600">New Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResults.updated || 0}
                  </div>
                  <div className="text-sm text-gray-600">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResults.errors || 0}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {(importResults.imported || 0) + (importResults.updated || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Processed</div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{importResults.message}</p>
              </div>
              
              {importResults.error_details && importResults.error_details.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Error Details:</h4>
                  <ul className="space-y-1">
                    {importResults.error_details.map((error, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Excel File Format</h3>
              <p className="text-sm text-gray-600 mb-3">
                Your Excel file should have the following columns in order:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-sm font-mono">
                  <div>YTPL Emp ID</div>
                  <div>Employee Full Name</div>
                  <div>DOJ</div>
                  <div>Title</div>
                  <div>Location</div>
                  <div>Company Email</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Important Notes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Employee Full Name</strong> is required for all rows</li>
                <li>• <strong>YTPL Emp ID</strong> should be unique (optional but recommended)</li>
                <li>• <strong>Title</strong> will be set as employee designation (optional)</li>
                <li>• <strong>Location</strong> will be matched with existing locations or created if new (optional)</li>
                <li>• <strong>Company Email</strong> should be a valid email format (optional)</li>
                <li>• <strong>DOJ</strong> is optional; formats like dd/mm/yyyy are supported</li>
                <li>• Existing employees will be updated if found by name or ID</li>
                <li>• New employees will be created with default role "Employee"</li>
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
    </div>
  );
};

export default EmployeeImport;
