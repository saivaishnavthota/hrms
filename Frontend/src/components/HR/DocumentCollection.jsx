import React, { useState, useEffect } from 'react';
import { Eye, FileText, Download, ExternalLink, X, CheckCircle, Clock, AlertCircle, Send, Check, XCircle } from 'lucide-react';

const DocumentCollection = () => {
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeesData, setEmployeesData] = useState([]);
  const [employeeDocuments, setEmployeeDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [, setIsRejectMode] = useState(false);
  const [, setSelectedDocuments] = useState([]);
  const [requestLogs, setRequestLogs] = useState([]);
  const [showRequestLogs, setShowRequestLogs] = useState(false);
  const [showDocumentRequestModal, setShowDocumentRequestModal] = useState(false);
  const [selectedEmployeeForRequest, setSelectedEmployeeForRequest] = useState(null);

  // API Functions
  const fetchEmployeesData = async () => {
    setLoadingEmployees(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/documents/all-documents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Transform API data to match component structure
      const transformedData = data.map(employee => {
        // Count uploaded documents
        const uploadedDocs = employee.documents ? employee.documents.length : 0;
        
        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          type: 'Employee', // Default since not provided in API
          role: employee.role || 'Employee',
          totalDocuments: 16, // Standard document count
          submittedDocuments: uploadedDocs,
          documents: employee.documents || []
        };
      });
      
      setEmployeesData(transformedData);
    } catch (error) {
      console.error('Error fetching employees data:', error);
      setEmployeesData([]); // Set empty array on error
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchEmployeeDocuments = async (employeeId) => {
    setLoadingDocuments(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/documents/emp/${employeeId}`);
      
      if (!response.ok) {
        // If no documents found, show empty state with all possible document types
        if (response.status === 404) {
          setEmployeeDocuments(getEmptyDocumentsList());
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const documents = await response.json();
      
      // Transform API response to match component structure
      const transformedDocs = documents.map(doc => ({
        id: doc.doc_type,
        name: getDocumentDisplayName(doc.doc_type),
        type: 'PDF',
        upload_date: doc.uploaded_at || 'N/A',
        url: doc.file_url,
        status: 'uploaded'
      }));

      // Merge with all possible document types to show missing ones
      const allDocTypes = getAllDocumentTypes();
      const completeDocList = allDocTypes.map(docType => {
        const uploadedDoc = transformedDocs.find(doc => doc.id === docType.id);
        return uploadedDoc || {
          ...docType,
          upload_date: 'N/A',
          url: null,
          status: 'not_uploaded'
        };
      });

      setEmployeeDocuments(completeDocList);
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      // Fallback to empty document list
      setEmployeeDocuments(getEmptyDocumentsList());
    } finally {
      setLoadingDocuments(false);
    }
  };

  const requestDocument = async (employeeId, documentType = 'General Document') => {
    try {
      const response = await fetch('http://127.0.0.1:8000/documents/request-doc', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          employee_id: employeeId,
          document_type: documentType
        })
      });
      
      if (!response.ok) {
        // Handle authentication errors gracefully
        if (response.status === 401) {
          console.warn('Authentication required for document requests');
          // Fallback to local logging
          const employee = employeesData.find(emp => emp.id === employeeId);
          const newLog = {
            id: Date.now(),
            employeeId,
            employeeName: employee?.name || 'Unknown',
            documentType,
            requestDate: new Date().toISOString(),
            status: 'pending'
          };
          
          setRequestLogs(prev => [newLog, ...prev]);
          alert(`Document request logged locally for ${employee?.name || 'employee'} (Authentication required for backend)`);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Add to request logs
      const employee = employeesData.find(emp => emp.id === employeeId);
      const newLog = {
        id: result.id || Date.now(),
        employeeId,
        employeeName: employee?.name || 'Unknown',
        documentType,
        requestDate: result.requested_at || new Date().toISOString(),
        status: result.status || 'pending'
      };
      
      setRequestLogs(prev => [newLog, ...prev]);
      
      // Show success message
      alert(result.message || `Document request sent to ${employee?.name || 'employee'}`);
      
    } catch (error) {
      console.error('Error requesting document:', error);
      alert('Failed to send document request. Please try again.');
    }
  };

  const fetchRequestLogs = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/documents/request-logs');
      if (!response.ok) {
        console.warn('Request logs endpoint not available or has errors');
        return;
      }
      const logs = await response.json();
      console.log('Raw request logs:', logs); // Debug log
      
      // Fetch employee data to get names
      try {
        const employeesResponse = await fetch('http://127.0.0.1:8000/users/employees');
        console.log('Employees response status:', employeesResponse.status); // Debug log
        
        let employeesMap = {};
        
        if (employeesResponse.ok) {
          const employees = await employeesResponse.json();
          console.log('Fetched employees:', employees); // Debug log
          
          // Create a map of employee_id -> employee data
          employeesMap = employees.reduce((map, emp) => {
            map[emp.employeeId] = emp;
            return map;
          }, {});
          console.log('Employees map:', employeesMap); // Debug log
        } else {
          console.error('Failed to fetch employees:', employeesResponse.status);
          // Fallback: use the employeesData we already have
          employeesMap = employeesData.reduce((map, emp) => {
            map[emp.employeeId] = emp;
            return map;
          }, {});
        }
        
        // Transform logs to match component structure with actual employee names
        const transformedLogs = logs.map(log => {
          const employee = employeesMap[log.employee_id];
          console.log(`Looking up employee ${log.employee_id}:`, employee); // Debug log
          
          return {
            id: log.id,
            employeeId: log.employee_id,
            employeeName: employee?.name ,
            documentType: log.document_type,
            requestDate: log.requested_at,
            status: log.status
          };
        });
        
        console.log('Transformed logs:', transformedLogs); // Debug log
        setRequestLogs(transformedLogs);
        
      } catch (employeeError) {
        console.error('Error fetching employees:', employeeError);
        // Use existing employeesData as fallback
        const employeesMap = employeesData.reduce((map, emp) => {
          map[emp.id] = emp;
          return map;
        }, {});
        
        const transformedLogs = logs.map(log => {
          const employee = employeesMap[log.employee_id];
          return {
            id: log.id,
            employeeId: log.employee_id,
            employeeName: employee?.name ,
            documentType: log.document_type,
            requestDate: log.requested_at,
            status: log.status
          };
        });
        
        setRequestLogs(transformedLogs);
      }
      
    } catch (error) {
      console.error('Error fetching request logs:', error);
    }
  };

  // Helper function to get all possible document types
  const getAllDocumentTypes = () => {
    return [
      { id: 'aadhar', name: 'Aadhar Card', type: 'PDF' },
      { id: 'pan', name: 'PAN Card', type: 'PDF' },
      { id: 'latest_graduation_certificate', name: 'Graduation Certificate', type: 'PDF' },
      { id: 'updated_resume', name: 'Resume', type: 'PDF' },
      { id: 'offer_letter', name: 'Offer Letter', type: 'PDF' },
      { id: 'latest_compensation_letter', name: 'Compensation Letter', type: 'PDF' },
      { id: 'experience_relieving_letter', name: 'Experience Letter', type: 'PDF' },
      { id: 'latest_3_months_payslips', name: 'Payslips', type: 'PDF' },
      { id: 'form16_or_12b_or_taxable_income', name: 'Tax Documents', type: 'PDF' },
      { id: 'ssc_certificate', name: 'SSC Certificate', type: 'PDF' },
      { id: 'hsc_certificate', name: 'HSC Certificate', type: 'PDF' },
      { id: 'hsc_marksheet', name: 'HSC Marksheet', type: 'PDF' },
      { id: 'graduation_marksheet', name: 'Graduation Marksheet', type: 'PDF' },
      { id: 'postgraduation_marksheet', name: 'Post Graduation Marksheet', type: 'PDF' },
      { id: 'postgraduation_certificate', name: 'Post Graduation Certificate', type: 'PDF' },
      { id: 'passport', name: 'Passport', type: 'PDF' }
    ];
  };

  const getEmptyDocumentsList = () => {
    return getAllDocumentTypes().map(docType => ({
      ...docType,
      upload_date: 'N/A',
      url: null,
      status: 'not_uploaded'
    }));
  };

  const getDocumentDisplayName = (docType) => {
    const displayNameMap = {
      aadhar: 'Aadhar Card',
      pan: 'PAN Card',
      latest_graduation_certificate: 'Graduation Certificate',
      updated_resume: 'Resume',
      offer_letter: 'Offer Letter',
      latest_compensation_letter: 'Compensation Letter',
      experience_relieving_letter: 'Experience Letter',
      latest_3_months_payslips: 'Payslips',
      form16_or_12b_or_taxable_income: 'Tax Documents',
      ssc_certificate: 'SSC Certificate',
      hsc_certificate: 'HSC Certificate',
      hsc_marksheet: 'HSC Marksheet',
      graduation_marksheet: 'Graduation Marksheet',
      postgraduation_marksheet: 'Post Graduation Marksheet',
      postgraduation_certificate: 'Post Graduation Certificate',
      passport: 'Passport',
    };
    return displayNameMap[docType] || docType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchEmployeesData();
    fetchRequestLogs();
  }, []);

  // Helper function to get avatar color
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Helper function to get status badge

  const handleViewDocuments = async (employee) => {
    setSelectedEmployee(employee);
    setShowDocumentsModal(true);
    await fetchEmployeeDocuments(employee.id);
  };

  const handleCloseModal = () => {
    setShowDocumentsModal(false);
    setSelectedEmployee(null);
    setEmployeeDocuments([]);
    setIsRejectMode(false);
    setSelectedDocuments([]);
  };

  const handleRequestDocument = (employeeId) => {
    const employee = employeesData.find(emp => emp.id === employeeId);
    setSelectedEmployeeForRequest(employee);
    setShowDocumentRequestModal(true);
  };

  const handleSpecificDocumentRequest = async (documentType) => {
    if (!selectedEmployeeForRequest) return;
    
    await requestDocument(selectedEmployeeForRequest.id, documentType);
    setShowDocumentRequestModal(false);
    setSelectedEmployeeForRequest(null);
  };


  const handleDownloadDocument = async (documentUrl, documentName) => {
    if (!documentUrl) return;
    
    try {
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documents Collection</h1>
              <p className="text-sm text-gray-600 mt-1">Manage employee document uploads and verification</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowRequestLogs(!showRequestLogs)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Request Logs ({requestLogs.length})
              </button>
              <div className="text-sm text-gray-500">
                Total Employees: <span className="font-semibold text-gray-900">{employeesData.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Request Logs Panel */}
        {showRequestLogs && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Document Request Logs</h3>
            {requestLogs.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {requestLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between bg-white p-3 rounded-md border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">{log.employeeName}</span>
                      <span className="text-sm text-gray-600">requested {log.documentType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(log.requestDate).toLocaleDateString()} {new Date(log.requestDate).toLocaleTimeString()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        log.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-blue-600">No document requests yet.</p>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loadingEmployees ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading employees...</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    View All Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeesData.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center`}>
                          <span className="text-sm font-medium text-white">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{employee.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{employee.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.submittedDocuments}/{employee.totalDocuments}
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(employee.submittedDocuments / employee.totalDocuments) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDocuments(employee)}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 hover:from-blue-200 hover:to-indigo-200 transition-all duration-200"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View All 
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRequestDocument(employee.id)}
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 hover:from-green-200 hover:to-emerald-200 transition-all duration-200"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Request Doc
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Empty State */}
        {!loadingEmployees && employeesData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">No employee document records available.</p>
          </div>
        )}
      </div>

      {/* Documents Modal */}
      {showDocumentsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white/80 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white">Documents - {selectedEmployee.name}</h3>
              <button onClick={handleCloseModal} className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading documents...</span>
                </div>
              ) : employeeDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employeeDocuments.map((doc, index) => (
                    <div key={`${doc.id || doc.type}-${index}`} className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-lg">📄</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 text-sm">{doc.name}</h4>
                            <p className="text-xs text-gray-500">Uploaded: {doc.upload_date}</p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border ${
                            doc.status === 'uploaded'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          {doc.status === 'uploaded' ? 'Uploaded' : 'Not Uploaded'}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 truncate" title={doc.name}>
                          {doc.type}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => { if (doc.url) window.open(doc.url, '_blank'); }}
                          disabled={!doc.url}
                          className={`flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium border rounded-md transition-colors ${
                            doc.url
                              ? 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                              : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc.url, doc.name)}
                          disabled={!doc.url}
                          className={`flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium border rounded-md transition-colors ${
                            doc.url
                              ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                              : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-500">No documents have been uploaded for this employee.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end items-center p-6 border-t border-gray-200">
              <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Request Modal */}
      {showDocumentRequestModal && selectedEmployeeForRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Request Document from {selectedEmployeeForRequest.name}
              </h3>
              <button 
                onClick={() => {
                  setShowDocumentRequestModal(false);
                  setSelectedEmployeeForRequest(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Select which document you want to request from {selectedEmployeeForRequest.name}:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getAllDocumentTypes().map((docType) => (
                  <button
                    key={docType.id}
                    onClick={() => handleSpecificDocumentRequest(docType.name)}
                    className="flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm">📄</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{docType.name}</div>
                      <div className="text-xs text-gray-500">{docType.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end items-center p-6 border-t border-gray-200 space-x-3">
              <button 
                onClick={() => {
                  setShowDocumentRequestModal(false);
                  setSelectedEmployeeForRequest(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSpecificDocumentRequest('General Document')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Request General Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCollection;