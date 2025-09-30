import React, { useState, useEffect } from 'react';
import { Eye, Trash2, X, FileText, Download, Check, XCircle, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { onboardingAPI } from '../../lib/api';

const OnboardingEmployees = () => {
  console.log("OnboardedEmployees component mounted");
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [employeeDocuments, setEmployeeDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);

  // Avatar color generator
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    fetchOnboardedEmployees();
  }, []);

  // Fetch employees from /onboarding/all
  const fetchOnboardedEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await onboardingAPI.getAllOnboardingEmployees();
      console.log(result);

      if (result.status === 'success') {
        // Fetch document count for each employee
        const employeesWithDocCount = await Promise.all(
          result.data.map(async (employee) => {
            try {
              const docData = await onboardingAPI.getEmployeeDocuments(employee.id);
              console.log("Employees state:", employees);
              console.log("Error state:", error);
              
              const docCount = Array.isArray(docData) ? docData.length : 0;
              
              return { 
                ...employee, 
                document_count: docCount,
                status: employee.o_status === true ? 'Active' : employee.o_status === false ? 'Inactive' : 'Pending' 
              };
            } catch {
              return { ...employee, document_count: 0, status: employee.o_status === true ? 'Active' : employee.o_status === false ? 'Inactive' : 'Pending' };
            }
          })
        );
        setEmployees(employeesWithDocCount);
      } else {
        throw new Error('Failed to fetch employees');
      }
    } catch (err) {
      console.error('Error fetching onboarded employees:', err);
      setError(err.message);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents from /onboarding/emp/{employee_id}
  const fetchEmployeeDocuments = async (employeeId) => {
    try {
      setLoadingDocuments(true);
      console.log(`Fetching documents for employee ${employeeId}`);
      
      const documents = await onboardingAPI.getEmployeeDocuments(employeeId);
      console.log('Received documents:', documents);
      
      // Transform the response to match UI expectations
      const transformedDocs = documents.map((doc) => ({
        id: doc.doc_type,
        type: doc.doc_type,
        name: formatDocumentName(doc.doc_type),
        upload_date: doc.uploaded_at || 'N/A',
        url: doc.file_url,
        available: true
      }));

      console.log('Transformed documents:', transformedDocs);
      setEmployeeDocuments(transformedDocs);
    } catch (err) {
      console.error('Error fetching employee documents:', err);
      setEmployeeDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Format document type names
  const formatDocumentName = (docType) => {
    const nameMap = {
      'aadhar': 'Aadhar Card',
      'pan': 'PAN Card',
      'latest_graduation_certificate': 'Graduation Certificate',
      'updated_resume': 'Resume',
      'offer_letter': 'Offer Letter',
      'latest_compensation_letter': 'Compensation Letter',
      'experience_relieving_letter': 'Relieving Letter',
      'latest_3_months_payslips': 'Payslips (3 months)',
      'form16_or_12b_or_taxable_income': 'Form 16/12B/Tax Income',
      'ssc_certificate': 'SSC Certificate',
      'hsc_certificate': 'HSC Certificate',
      'hsc_marksheet': 'HSC Marksheet',
      'graduation_marksheet': 'Graduation Marksheet',
      'postgraduation_marksheet': 'Post Graduation Marksheet',
      'postgraduation_certificate': 'Post Graduation Certificate',
      'passport': 'Passport'
    };
    return nameMap[docType] || docType.replace(/_/g, ' ').toUpperCase();
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Inactive': 'bg-red-100 text-red-800 border-red-200'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status}
      </span>
    );
  };

  const handleViewDocuments = async (employee) => {
    setSelectedEmployee(employee);
    setShowDocumentsModal(true);
    await fetchEmployeeDocuments(employee.id);
  };

  const handleViewEmployeeDetails = async (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDetailsModal(true);
    await fetchEmployeeDetails(employee.id);
  };

  // Fetch employee details from /onboarding/details/{employee_id}
  const fetchEmployeeDetails = async (employeeId) => {
    try {
      setLoadingEmployeeDetails(true);
      const result = await onboardingAPI.getEmployeeDetails(employeeId);
      setEmployeeDetails(result.data);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch employee details. Please try again.',
      });
    } finally {
      setLoadingEmployeeDetails(false);
    }
  };

  const handleCloseModal = () => {
    setShowDocumentsModal(false);
    setSelectedEmployee(null);
    setEmployeeDocuments([]);
    setSelectedDocuments([]);
    setIsRejectMode(false);
  };

  const handleCloseEmployeeDetailsModal = () => {
    setShowEmployeeDetailsModal(false);
    setSelectedEmployee(null);
    setEmployeeDetails(null);
  };

  const handleDocumentSelection = (documentId) => {
    setSelectedDocuments(prev =>
      prev.includes(documentId) ? prev.filter(id => id !== documentId) : [...prev, documentId]
    );
  };

  // Approve all documents - POST /onboarding/hr/approve/{onboarding_id}
  const handleApproveAll = async () => {
    try {
      const result = await onboardingAPI.approveEmployee(selectedEmployee.id);
      Swal.fire('Success', result.message || 'All documents approved!', 'success');
      handleCloseModal();
      fetchOnboardedEmployees();
    } catch (error) {
      console.error('Error approving documents:', error);
      Swal.fire('Error', 'Failed to approve documents', 'error');
    }
  };

  // Reject Employee - DELETE /onboarding/hr/reject/{onboarding_id}
  const handleRejectDocuments = async (employeeId) => {
    Swal.fire({
      title: "Reject Employee?",
      text: "This will mark the employee as rejected.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, reject"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await onboardingAPI.rejectEmployee(employeeId);
          setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
          handleCloseModal();
          Swal.fire("Rejected!", "Employee has been moved to rejected list.", "success");
        } catch (error) {
          Swal.fire("Error!", error.message, "error");
        }
      }
    });
  };

  // Delete Employee - DELETE /onboarding/hr/delete/{onboarding_id}
  const handleDeleteEmployee = async (employeeId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the employee from the database!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await onboardingAPI.deleteEmployee(employeeId);
          setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
          Swal.fire("Deleted!", "Employee has been permanently removed.", "success");
        } catch (error) {
          Swal.fire("Error!", error.message, "error");
        }
      }
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Onboarded Employees</h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center">Loading...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center">No employees found</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap flex items-center">
                    <div className={`${getAvatarColor(emp.name)} w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm mr-4`}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                      <div className="text-sm text-gray-500">{emp.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{emp.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{emp.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDocuments(emp)}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 hover:from-blue-200 hover:to-indigo-200 transition-all duration-200"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      View Docs ({emp.document_count})
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(emp.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                    <button onClick={() => handleViewEmployeeDetails(emp)} className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors" title="View Employee Details"><User className="w-4 h-4" /></button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents Modal */}
      {showDocumentsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white/80 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white">Documents - {selectedEmployee.name}</h3>
              <button onClick={handleCloseModal} className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500"><X size={24} /></button>
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
                    <div key={`${doc.id}-${index}`} className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          {isRejectMode && (
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={() => handleDocumentSelection(doc.id)}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          )}
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-lg">📄</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 text-sm">{doc.name}</h4>
                            <p className="text-xs text-gray-500">Uploaded: {doc.upload_date}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 truncate" title={doc.name}>
                          {doc.type}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(doc.url, '_blank')}
                          className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={async () => {
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
                              Swal.fire('Error', 'Failed to download file', 'error');
                            }
                          }}
                          className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
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
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button onClick={handleApproveAll} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"><Check className="w-4 h-4 mr-2" />Approve All</button>
                <button onClick={() => setIsRejectMode(!isRejectMode)} className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">{isRejectMode ? 'Cancel' : 'Reject'}</button>
                {isRejectMode && selectedDocuments.length > 0 && <button
              onClick={() => handleRejectDocuments(selectedEmployee.id)} className="inline-flex items-center px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors duration-200">Reject Selected ({selectedDocuments.length})</button>}
              </div>
              <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white/90 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-blue-600 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white">Employee Details - {selectedEmployee.name}</h3>
              <button onClick={handleCloseEmployeeDetailsModal} className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {loadingEmployeeDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">Loading employee details...</span>
                </div>
              ) : employeeDetails ? (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-md">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-green-600" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.full_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Employee ID</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.employee_id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Contact Number</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.contact_no}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Personal Email</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.personal_email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-gray-900 font-medium">{new Date(employeeDetails.dob).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Gender</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.gender}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Education & Experience */}
                  <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-md">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Education & Experience
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Graduation Year</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.graduation_year}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Work Experience</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.work_experience_years} years</p>
                      </div>
                      {employeeDetails.doj && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Date of Joining</label>
                          <p className="text-gray-900 font-medium">{new Date(employeeDetails.doj).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-md">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Eye className="w-5 h-5 mr-2 text-red-600" />
                      Emergency Contact
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Contact Name</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.emergency_contact_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Contact Number</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.emergency_contact_number}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Relationship</label>
                        <p className="text-gray-900 font-medium">{employeeDetails.emergency_contact_relation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {employeeDetails.created_at && (
                    <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-md">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Onboarding Date</label>
                        <p className="text-gray-900 font-medium">{new Date(employeeDetails.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No details found</h3>
                  <p className="text-gray-500">Employee details could not be loaded.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button onClick={handleCloseEmployeeDetailsModal} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingEmployees;