import React, { useState, useEffect } from 'react';
import { Eye, FileText, Download, ExternalLink, X, CheckCircle, Clock, AlertCircle, Send, Check, XCircle } from 'lucide-react';
import { avatarBg } from '../../lib/avatarColors';

const DocumentCollection = () => {
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeesData, setEmployeesData] = useState([]);
  const [employeeDocuments, setEmployeeDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [requestLogs, setRequestLogs] = useState([]);
  const [showRequestLogs, setShowRequestLogs] = useState(false);


  // API Functions
  const fetchEmployeesData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/documents/all-documents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Transform API data to match component structure
      const transformedData = data.map(employee => ({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        type: employee.type || 'Full-time',
        role: employee.role || 'Employee',
        totalDocuments: 16, // Standard document count
        submittedDocuments: Object.values(employee.documents || {}).filter(Boolean).length,
        documents: [] // Will be populated when viewing individual employee documents
      }));
      
      setEmployeesData(transformedData);
    } catch (error) {
      console.error('Error fetching employees data:', error);
      // Fallback to sample data if API fails
      setEmployeesData(sampleEmployeesData);
    }
  };

  const fetchEmployeeDocuments = async (employeeId) => {
    setLoadingDocuments(true);
    try {
      // Fetch all documents for all employees, then pick current employee
      const response = await fetch('http://127.0.0.1:8000/documents/all-documents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allDocsData = await response.json();

      const employeeEntry = Array.isArray(allDocsData)
        ? allDocsData.find((e) => String(e.id) === String(employeeId))
        : null;

      // Backend canonical document fields
      const docFields = [
        'aadhar',
        'pan',
        'latest_graduation_certificate',
        'updated_resume',
        'offer_letter',
        'latest_compensation_letter',
        'experience_relieving_letter',
        'latest_3_months_payslips',
        'form16_or_12b_or_taxable_income',
        'ssc_certificate',
        'hsc_certificate',
        'hsc_marksheet',
        'graduation_marksheet',
        'postgraduation_marksheet',
        'postgraduation_certificate',
        'passport',
      ];

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

      const statusDict = employeeEntry?.documents || {};

      const transformedDocs = docFields.map((key) => {
        const isUploaded = Boolean(statusDict[key]);
        return {
          id: key,
          name: displayNameMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          type: 'PDF',
          upload_date: isUploaded ? (employeeEntry?.uploaded_at || 'N/A') : 'N/A',
          url: isUploaded ? `http://127.0.0.1:8000/documents/${employeeId}/${key}` : null,
          status: isUploaded ? 'uploaded' : 'not_uploaded',
        };
      });

      setEmployeeDocuments(transformedDocs);
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      // Fallback to empty list of all known document types with not uploaded
      const docFields = [
        'aadhar',
        'pan',
        'latest_graduation_certificate',
        'updated_resume',
        'offer_letter',
        'latest_compensation_letter',
        'experience_relieving_letter',
        'latest_3_months_payslips',
        'form16_or_12b_or_taxable_income',
        'ssc_certificate',
        'hsc_certificate',
        'hsc_marksheet',
        'graduation_marksheet',
        'postgraduation_marksheet',
        'postgraduation_certificate',
        'passport',
      ];
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
      setEmployeeDocuments(
        docFields.map((key) => ({
          id: key,
          name: displayNameMap[key] || key,
          type: 'PDF',
          upload_date: 'N/A',
          url: null,
          status: 'not_uploaded',
        }))
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  const requestDocument = async (employeeId, documentType = 'General Document') => {
    try {
      // Since there's no specific document request endpoint, we'll use the save-draft endpoint
      // to log the request or create a notification system
      const response = await fetch('http://127.0.0.1:8000/documents/request-doc', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          employee_id: employeeId,
          // Create a draft entry to indicate document was requested
          requested_document: true,
          request_type: documentType,
          request_timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Add to request logs
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
      
      // Show success message
      alert(`Document request sent to ${employee?.name || 'employee'}`);
      
    } catch (error) {
      console.error('Error requesting document:', error);
      
      // Still add to local logs even if API fails
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
      alert('Document request logged locally (API unavailable)');
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchEmployeesData();
  }, []);

  // Helper function to get avatar color
  const getAvatarColor = (name) => avatarBg(name);

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Helper function to get document type icon
  const getDocumentIcon = (type) => {
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

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
    requestDocument(employeeId);
  };

  const handleDocumentSelection = (documentId) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleApproveAll = async () => {
    try {
      // API call to approve all documents
      // const response = await fetch('/api/documents/approve-all', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ employeeId: selectedEmployee.id })
      // });
      
      // Update local state
      setEmployeeDocuments(prev => 
        prev.map(doc => ({ ...doc, status: 'approved' }))
      );
      
      alert('All documents approved successfully');
    } catch (error) {
      console.error('Error approving documents:', error);
      alert('Failed to approve documents');
    }
  };

  const handleRejectDocuments = async () => {
    try {
      // API call to reject selected documents
      // const response = await fetch('/api/documents/reject', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     employeeId: selectedEmployee.id,
      //     documentIds: selectedDocuments 
      //   })
      // });
      
      // Update local state
      setEmployeeDocuments(prev => 
        prev.map(doc => 
          selectedDocuments.includes(doc.id) 
            ? { ...doc, status: 'rejected' }
            : doc
        )
      );
      
      setSelectedDocuments([]);
      setIsRejectMode(false);
      alert(`${selectedDocuments.length} document(s) rejected`);
    } catch (error) {
      console.error('Error rejecting documents:', error);
      alert('Failed to reject documents');
    }
  };

  const handleDownloadDocument = (documentId) => {
    console.log('Download document:', documentId);
    // Implement download functionality
  };

  const handleApproveDocument = (employeeId, documentId) => {
    setEmployeesData(prevData => 
      prevData.map(employee => 
        employee.id === employeeId 
          ? {
              ...employee,
              documents: employee.documents.map(doc => 
                doc.id === documentId 
                  ? { ...doc, status: 'approved' }
                  : doc
              )
            }
          : employee
      )
    );
    console.log('Document approved:', documentId);
  };

  const handleRejectDocument = (employeeId, documentId) => {
    setEmployeesData(prevData => 
      prevData.map(employee => 
        employee.id === employeeId 
          ? {
              ...employee,
              documents: employee.documents.map(doc => 
                doc.id === documentId 
                  ? { ...doc, status: 'rejected' }
                  : doc
              )
            }
          : employee
      )
    );
    console.log('Document rejected:', documentId);
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
        </div>

        {/* Empty State */}
        {employeesData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">No employee document records available.</p>
          </div>
        )}
      </div>

      {/* Documents Modal - Using OnboardingEmployees.jsx style */}
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
                          onClick={async () => {
                            if (!doc.url) return;
                            try {
                              const response = await fetch(doc.url);
                              if (!response.ok) throw new Error('Failed to download file');
                              const blob = await response.blob();
                              const link = document.createElement('a');
                              link.href = window.URL.createObjectURL(blob);
                              link.download = doc.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } catch (error) {
                              console.error('Download error:', error);
                            }
                          }}
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
    </div>
  );
};

export default DocumentCollection;