import React, { useState, useEffect } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "../../contexts/UserContext";
import axios from "axios";

const API_BASE = "http://localhost:8000";

const UploadDocuments = ({ id }) => {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useUser();

  // Backend-defined doc types
  const documentTypes = [
    "aadhar",
    "pan",
    "latest_graduation_certificate",
    "updated_resume",
    "offer_letter",
    "latest_compensation_letter",
    "experience_relieving_letter",
    "latest_3_months_payslips",
    "form16_or_12b_or_taxable_income",
    "ssc_certificate",
    "hsc_certificate",
    "hsc_marksheet",
    "graduation_marksheet",
    "postgraduation_marksheet",
    "postgraduation_certificate",
    "passport",
  ];

  // Load existing docs from backend
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const employeeId = id || user?.employeeId;
        if (!employeeId) {
          console.warn("No employeeId available yet, skipping fetch");
          return;
        }

        const res = await axios.get(`${API_BASE}/documents/emp/${employeeId}`);
        const backendDocsArray = res.data; // list of DocumentStatus
        // Convert array → dictionary { doc_type: {...} }
        const backendDocs = {};
        backendDocsArray.forEach((doc) => {
          backendDocs[doc.doc_type] = doc;
        });

        // Map to frontend state
        const mappedDocs = documentTypes.map((type) => ({
          id: Date.now() + Math.random(),
          type,
          name: backendDocs[type]?.file_name || "",
          url: backendDocs[type]?.file_url || "",
          status: backendDocs[type] ? "completed" : "pending",
          description: backendDocs[type]?.description || "",
          file: null,
          size: backendDocs[type]?.size || 0,
        }));

        setDocuments(mappedDocs);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setMessage("Failed to load documents.");
      }
    };

    fetchDocuments();
  }, [id, user]);

  const handleFileSelect = (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.type === docType
          ? {
              ...doc,
              id: Date.now() + Math.random(),
              file,
              name: file.name,
              size: file.size,
              status: "pending",
              url: "",
            }
          : doc
      )
    );
  };

  // Reset slot instead of removing it
  const handleRemoveDocument = (docType) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.type === docType
          ? {
              ...doc,
              id: Date.now() + Math.random(),
              file: null,
              name: "",
              size: 0,
              status: "pending",
              url: "",
            }
          : doc
      )
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const employeeId = id || user?.employeeId;
    if (!employeeId) {
      setMessage("Employee ID is missing, cannot upload.");
      return;
    }

    if (documents.every((doc) => !doc.file)) {
      setMessage("Please select at least one document to upload.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("employeeId", employeeId);
      documents.forEach((doc) => {
        if (doc.file) {
          formData.append(doc.type, doc.file);
        }
      });

      const response = await axios.post(`${API_BASE}/documents/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Upload response:", response.data);
      setMessage("All documents uploaded successfully!");
      // Refresh docs after upload
      setDocuments((prev) =>
        prev.map((doc) => ({
          ...doc,
          file: null,
          status: response.data.uploaded_files.find((f) => f.doc_type === doc.type)
            ? "completed"
            : doc.status,
        }))
      );
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage("Failed to upload documents. Please try again.");
      setDocuments((prev) => prev.map((doc) => ({ ...doc, status: "error" })));
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
            <p className="text-sm text-muted-foreground">
              Upload or view your employment documents
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              message.includes("success")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.includes("success") ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.type} className="border border-border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <File className="h-5 w-5 text-gray-600" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-card-foreground capitalize">
                          {doc.type.replace(/_/g, " ")}
                        </p>
                        {doc.size > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(doc.size)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.status === "uploading" && (
                          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {doc.status === "completed" && doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 underline"
                          >
                            View
                          </a>
                        )}
                        {doc.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(doc.type)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(e, doc.type)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {documents.some((doc) => doc.file) && (
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isUploading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : (
                  "Upload Selected"
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadDocuments;

