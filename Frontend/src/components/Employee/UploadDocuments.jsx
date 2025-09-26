import React, { useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UploadDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const documentTypes = [
    'Resume/CV',
    'ID Proof',
    'Address Proof',
    'Educational Certificates',
    'Experience Letters',
    'Salary Slips',
    'Bank Details',
    'Medical Certificates',
    'Other'
  ];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: '',
      description: '',
      status: 'pending'
    }));
    
    setDocuments(prev => [...prev, ...newDocuments]);
  };

  const handleDocumentUpdate = (id, field, value) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  const handleRemoveDocument = (id) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (documents.length === 0) {
      setMessage('Please select at least one document to upload.');
      return;
    }

    const incompleteDocuments = documents.filter(doc => !doc.type);
    if (incompleteDocuments.length > 0) {
      setMessage('Please select document type for all uploaded files.');
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      // Simulate file upload process
      for (let i = 0; i < documents.length; i++) {
        setDocuments(prev => prev.map(doc => 
          doc.id === documents[i].id ? { ...doc, status: 'uploading' } : doc
        ));
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDocuments(prev => prev.map(doc => 
          doc.id === documents[i].id ? { ...doc, status: 'completed' } : doc
        ));
      }

      setMessage('All documents uploaded successfully! They will be reviewed by HR.');
      
      // Clear documents after success
      setTimeout(() => {
        setDocuments([]);
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage('Failed to upload documents. Please try again.');
      setDocuments(prev => prev.map(doc => ({ ...doc, status: 'error' })));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Upload className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">Upload Documents</h2>
            <p className="text-sm text-muted-foreground">Upload your employment documents</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.includes('success') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.includes('success') ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload').click()}
              className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              Select Files
            </Button>
          </div>

          {/* Document List */}
          {documents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-card-foreground">Selected Documents</h3>
              
              {documents.map((doc) => (
                <div key={doc.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <File className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-card-foreground">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{formatFileSize(doc.size)}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {doc.status === 'uploading' && (
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {doc.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {doc.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-card-foreground mb-1">
                            Document Type *
                          </label>
                          <select
                            value={doc.type}
                            onChange={(e) => handleDocumentUpdate(doc.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            required
                          >
                            <option value="">Select type</option>
                            {documentTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-card-foreground mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={doc.description}
                            onChange={(e) => handleDocumentUpdate(doc.id, 'description', e.target.value)}
                            placeholder="Brief description..."
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          {documents.length > 0 && (
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isUploading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading Documents...
                  </div>
                ) : (
                  `Upload ${documents.length} Document${documents.length !== 1 ? 's' : ''}`
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDocuments([]);
                  setMessage('');
                }}
                className="px-6"
              >
                Clear All
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadDocuments;