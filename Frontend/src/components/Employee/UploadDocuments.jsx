import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp, Eye, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useUser } from '../../contexts/UserContext';

export default function UploadDocuments() {
  const { user } = useUser();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [dragOver, setDragOver] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    employee: false,
    educational: false,
    identity: false
  });

  const documentSections = {
    employee: {
      title: 'Employee Documents',
      documents: [
        { id: 'updated_resume', name: 'Updated Resume', required: false },
        { id: 'offer_letter', name: 'Offer Letter', required: false },
        { id: 'latest_compensation_letter', name: 'Latest Compensation Letter', required: false },
        { id: 'experience_relieving_letter', name: 'Experience & Relieving Letter', required: false },
        { id: 'latest_3_months_payslips', name: 'Latest 3 months Pay Slips', required: false },
        { id: 'form16_or_12b_or_taxable_income', name: 'Form 16/ Form 12B / Taxable Income Statement', required: false }
      ]
    },
    educational: {
      title: 'Educational Documents',
      documents: [
        { id: 'ssc_certificate', name: 'SSC Certificate', required: false },
        { id: 'hsc_certificate', name: 'HSC Certificate', required: false },
        { id: 'hsc_marksheet', name: 'HSC Marksheet', required: false },
        { id: 'graduation_marksheet', name: 'Graduation Marksheet', required: false },
        { id: 'latest_graduation_certificate', name: 'Latest Graduation', required: true },
        { id: 'postgraduation_marksheet', name: 'Post-Graduation Marksheet', required: false },
        { id: 'postgraduation_certificate', name: 'Post-Graduation Certificate', required: false }
      ]
    },
    identity: {
      title: 'Identity Proof',
      documents: [
        { id: 'aadhar', name: 'Aadhar', required: true },
        { id: 'pan', name: 'PAN', required: true },
        { id: 'passport', name: 'Passport', required: false }
      ]
    }
  };

  // Fetch existing uploaded documents on component mount
  useEffect(() => {
    const fetchUploadedDocuments = async () => {
      try {
        const employee_id = user?.employeeId || 0;
        if (!employee_id) {
          console.log('No employee ID found, skipping document fetch');
          return;
        }
        
        // GET request to fetch existing uploaded documents for this employee
        const response = await axios.get(`http://127.0.0.1:8000/documents/emp/${employee_id}`);
        if (response.data) {
          // Convert the boolean response to uploadedFiles format
          const uploadedFilesData = {};
          
          // Document type to display name mapping
          const documentDisplayNames = {
            "aadhar": "Aadhar Card",
            "pan": "PAN Card", 
            "latest_graduation_certificate": "Graduation Certificate",
            "updated_resume": "Updated Resume",
            "offer_letter": "Offer Letter",
            "latest_compensation_letter": "Compensation Letter",
            "experience_relieving_letter": "Relieving Letter",
            "latest_3_months_payslips": "Latest 3 Months Payslips",
            "form16_or_12b_or_taxable_income": "Form 16/12B/Taxable Income",
            "ssc_certificate": "SSC Certificate",
            "hsc_certificate": "HSC Certificate", 
            "hsc_marksheet": "HSC Marksheet",
            "graduation_marksheet": "Graduation Marksheet",
            "postgraduation_marksheet": "Post Graduation Marksheet",
            "postgraduation_certificate": "Post Graduation Certificate",
            "passport": "Passport"
          };
          
          Object.keys(response.data).forEach(key => {
            if (key !== 'employeeId' && key !== 'uploaded_at' && response.data[key] === true) {
              uploadedFilesData[key] = { 
                name: key, 
                displayName: documentDisplayNames[key] || key,
                actualFileName: `${documentDisplayNames[key] || key}.pdf`, // Default extension, will be updated from backend
                uploaded: true 
              };
            }
          });
          setUploadedFiles(uploadedFilesData);
          
        }
      } catch (error) {
        console.error('Error fetching uploaded documents:', error);
        // Only show error toast if it's not a 404 (no data found)
        if (error.response?.status !== 404) {
          toast.error('Failed to load existing documents');
        }
      }
    };

    if (user?.employeeId) {
      fetchUploadedDocuments();
    }
  }, [user]);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const getSectionProgress = (sectionKey) => {
    const section = documentSections[sectionKey];
    const allDocs = section.documents; // Count all documents, not just required ones
    const uploadedDocs = allDocs.filter(doc => uploadedFiles[doc.id]);
    return {
      uploaded: uploadedDocs.length,
      total: allDocs.length
    };
  };

  const handleFileSelect = (documentId, files) => {
    const file = files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds 5MB. Please select a smaller file.`);
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const acceptedFormats = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    if (!acceptedFormats.includes(fileExtension)) {
      toast.error(`Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`);
      return;
    }

    setUploadedFiles(prev => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;
  return {
      ...prev,
      [documentId]: {
        file,
        name: file.name,
        size: file.size,
        uploaded_at: formattedDate,
        status: 'uploaded',
        url: URL.createObjectURL(file),
        type: file.type
      }
    }
    })
  };

  const handleDrop = (e, documentId) => {
    e.preventDefault();
    setDragOver(null);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(documentId, files);
  };

  const handleDragOver = (e, documentId) => {
    e.preventDefault();
    setDragOver(documentId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(null);
  };

  const removeFile = (documentId) => {
    const fileData = uploadedFiles[documentId];
    if (fileData && fileData.url) {
      URL.revokeObjectURL(fileData.url); // Clean up memory
    }
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[documentId];
      return updated;
    });
  };

  const handlePreview = async (fileData) => {
    try {
      // If this is a newly uploaded file with local data
      if (fileData.file && fileData.url) {
        setPreviewFile(fileData);
        return;
      }
      
      // If this is a previously uploaded file from backend, fetch it
      if (fileData.uploaded && fileData.name) {
        const employee_id = user?.employeeId || 0;
        const response = await axios.get(
          `http://127.0.0.1:8000/documents/${employee_id}/${fileData.name}`,
          { responseType: 'blob' }
        );
        
        // Create a blob URL for preview
        const blob = response.data;
        const url = URL.createObjectURL(blob);
        
        // Get content type from response headers
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        
        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let actualFileName = fileData.actualFileName || fileData.displayName || fileData.name;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            actualFileName = filenameMatch[1].replace(/['"]/g, '');
            
            // Update the uploadedFiles with the actual filename for future reference
            setUploadedFiles(prev => ({
              ...prev,
              [fileData.name]: {
                ...prev[fileData.name],
                actualFileName: actualFileName
              }
            }));
          }
        }
        
        // Update the uploadedFiles with the actual filename for future reference
        setUploadedFiles(prev => ({
          ...prev,
          [fileData.name]: {
            ...prev[fileData.name],
            actualFileName: actualFileName
          }
        }));
        
        setPreviewFile({
          name: actualFileName,
          url: url,
          type: contentType,
          size: blob.size,
          uploaded: true
        });
      }
    } catch (error) {
      console.error('Error loading file for preview:', error);
      toast.error('Failed to load file for preview');
    }
  };

  const closePreview = () => {
    // Clean up blob URL to prevent memory leaks
    if (previewFile?.url && previewFile.uploaded) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  const downloadFile = async (fileData) => {
    try {
      // If this is a newly uploaded file with local data
      if (fileData.file && fileData.url) {
        const link = document.createElement('a');
        link.href = fileData.url;
        link.download = fileData.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // If this is a previously uploaded file from backend, fetch it
      if (fileData.uploaded && fileData.name) {
        const employee_id = user?.employeeId || 0;
        const response = await axios.get(
          `http://127.0.0.1:8000/documents/${employee_id}/${fileData.name}`,
          { responseType: 'blob' }
        );
        
        // Create a blob URL for download
        const blob = response.data;
        const url = URL.createObjectURL(blob);
        
        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let actualFileName = fileData.actualFileName || fileData.displayName || fileData.name;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            actualFileName = filenameMatch[1].replace(/['"]/g, '');
            
            // Update the uploadedFiles with the actual filename for future reference
            setUploadedFiles(prev => ({
              ...prev,
              [fileData.name]: {
                ...prev[fileData.name],
                actualFileName: actualFileName
              }
            }));
          }
        }
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = actualFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getOverallProgress = () => {
    const allRequiredDocs = Object.values(documentSections).flatMap(section => 
      section.documents.filter(doc => doc.required)
    );
    const uploadedRequiredDocs = allRequiredDocs.filter(doc => uploadedFiles[doc.id]);
    return {
      total: allRequiredDocs.length,
      uploaded: uploadedRequiredDocs.length,
      isComplete: uploadedRequiredDocs.length === allRequiredDocs.length
    };
  };

  const handleSaveDraft = async () => {
    const employee_id = user?.employeeId || 0;
    if (!employee_id) {
      toast.error('Employee ID not found. Please login again.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      // save-draft expects employee_id and boolean flags for each document type
      formData.append('employee_id', employee_id.toString());

      const docFlags = [
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
        'passport'
      ];

      docFlags.forEach((flag) => {
        const hasFile = Boolean(uploadedFiles[flag] && uploadedFiles[flag].file);
        formData.append(flag, hasFile ? 'true' : 'false');
      });

      const response = await axios.post(`http://127.0.0.1:8000/documents/save-draft`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.data) {
        toast.success('Draft saved successfully!');
      }
      
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const status = getOverallProgress();
    
    if (!status.isComplete) {
      toast.warning('Please upload all required documents before submitting.');
      return;
    }

    const employee_id = user?.employeeId || 0;
    if (!employee_id) {
      toast.error('Employee ID not found. Please login again.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      Object.entries(uploadedFiles).forEach(([documentId, fileData]) => {
        formData.append(documentId, fileData.file);
      });

      // Add employeeId as form field (required by backend)
      formData.append('employeeId', employee_id.toString());

      // POST request to upload documents
      const response = await axios.post(`http://127.0.0.1:8000/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });
      
      if (response.data) {
        toast.success('Documents uploaded successfully!');
      }
      
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = getOverallProgress();

  return (
    <div className="min-h-screen w-full bg-gray-50 overflow-hidden">
      <div className="py-6 px-4 w-full flex justify-center">
        <div style={{width: '800px'}} className="my-6 mb-12 p-6 bg-white rounded-xl shadow-xl border border-gray-100 overflow-y-auto max-h-full">
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Documents Upload
                </h2>
                <p className="text-gray-600 mb-3">* marked documents are mandatory</p>
                
                {/* Overall Progress */}
                <div className="bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(status.uploaded / status.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {status.uploaded} of {status.total} required documents uploaded
                </p>
              </div>

        <div className="space-y-4">
          {Object.entries(documentSections).map(([sectionKey, section]) => {
            const sectionProgress = getSectionProgress(sectionKey);
            const isExpanded = expandedSections[sectionKey];
            
            return (
              <div key={sectionKey} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Section Header */}
                <div 
                  className="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => toggleSection(sectionKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                      <span className="text-sm text-gray-600">
                        {sectionProgress.uploaded} / {sectionProgress.total} uploaded
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Content */}
                {isExpanded && (
                  <div className="p-3 bg-white">
                    <div className="grid grid-cols-1 gap-3">
                      {section.documents.map((document) => {
                        const isUploaded = uploadedFiles[document.id];
                        const isDraggedOver = dragOver === document.id;

                        return (
                          <div
                            key={document.id}
                            className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${
                              isDraggedOver
                                ? 'border-blue-500 bg-blue-50'
                                : isUploaded
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onDrop={(e) => handleDrop(e, document.id)}
                            onDragOver={(e) => handleDragOver(e, document.id)}
                            onDragLeave={handleDragLeave}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 flex items-center">
                                  {document.name}
                                  {document.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </h4>
                                
                                {!isUploaded ? (
                                  <div className="mt-2">
                                    <div className="flex items-center space-x-2">
                                      <Upload className="w-4 h-4 text-gray-400" />
                                      <label className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer underline">
                                        Click to upload
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                          onChange={(e) => handleFileSelect(document.id, e.target.files)}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="flex items-center space-x-2">
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                          <span className="text-sm font-medium text-green-600">Uploaded</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-sm text-gray-700 font-medium">{isUploaded.actualFileName || isUploaded.name}</span>
                                         
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => handlePreview(isUploaded)}
                                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                          title="Preview file"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => downloadFile(isUploaded)}
                                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                          title="Download file"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => removeFile(document.id)}
                                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                          title="Remove file"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* File Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col shadow-2xl border border-white/20">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{previewFile.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(previewFile.size)} • {previewFile.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadFile(previewFile)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title="Download file"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closePreview}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title="Close preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 p-4 overflow-auto">
                {previewFile.type.startsWith('image/') ? (
                  <div className="flex justify-center">
                    <img 
                      src={previewFile.url} 
                      alt={previewFile.name}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                ) : previewFile.type === 'application/pdf' ? (
                  <div className="w-full h-96">
                    <iframe 
                      src={previewFile.url} 
                      className="w-full h-full border rounded"
                      title={previewFile.name}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <FileText className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">Preview not available</p>
                    <p className="text-sm">This file type cannot be previewed in the browser.</p>
                    <button
                      onClick={() => downloadFile(previewFile)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Download to view
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end items-center mt-4 pt-4 border-t border-gray-200">
          {/* Save Draft and Submit Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
            >
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={!status.isComplete || isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit All'}
            </button>
          </div>
        </div>

        {!status.isComplete && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                Please upload all required documents to proceed.
              </p>
            </div>
          </div>
        )}
        </>
        </div>
      </div>
    </div>
  );
}