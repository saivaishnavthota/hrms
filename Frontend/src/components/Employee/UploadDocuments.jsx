import React, { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "../../contexts/UserContext";
import api from "@/lib/api"; // Axios instance
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UploadDocuments = ({ id }) => {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useUser();

  const documentTypes = [
    "aadhar", "pan", "latest_graduation_certificate", "updated_resume",
    "offer_letter", "latest_compensation_letter", "experience_relieving_letter",
    "latest_3_months_payslips", "form16_or_12b_or_taxable_income",
    "ssc_certificate", "hsc_certificate", "hsc_marksheet", "graduation_marksheet",
    "postgraduation_marksheet", "postgraduation_certificate", "passport",
  ];

  // Load existing docs
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const employeeId = id || user?.employeeId;
        if (!employeeId) return;

        const res = await api.get(`/documents/emp/${employeeId}`);
        const backendDocsArray = res.data;

        const backendDocs = {};
        backendDocsArray.forEach((doc) => {
          backendDocs[doc.doc_type] = doc;
        });

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
          ? { ...doc, id: Date.now() + Math.random(), file, name: file.name, size: file.size, status: "pending", url: "" }
          : doc
      )
    );
  };

  const handleRemoveDocument = (docType) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.type === docType
          ? { ...doc, id: Date.now() + Math.random(), file: null, name: "", size: 0, status: "pending", url: "" }
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
      toast.error("Employee ID is missing, cannot upload.");
      return;
    }

    if (documents.every((doc) => !doc.file)) {
      toast.warning("Please select at least one document to upload.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("employeeId", employeeId);
      documents.forEach((doc) => {
        if (doc.file) formData.append(doc.type, doc.file);
      });

      const response = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("All documents uploaded successfully!");

      setDocuments((prev) =>
        prev.map((doc) => ({
          ...doc,
          file: null,
          status: response.data.uploaded_files.find((f) => f.doc_type === doc.type) ? "completed" : doc.status,
        }))
      );
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload documents. Please try again.");
      setDocuments((prev) => prev.map((doc) => ({ ...doc, status: "error" })));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 border p-2 rounded-md">
            <div className="flex-1">
              <p className="font-medium text-card-foreground">{doc.type.replace(/_/g, " ")}</p>
              <p className="text-xs text-muted-foreground">{doc.name || "No file selected"}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
            </div>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => handleFileSelect(e, doc.type)}
              className="hidden"
              id={`file-${doc.type}`}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => document.getElementById(`file-${doc.type}`).click()}>
                <Upload className="h-4 w-4 mr-1" /> Upload
              </Button>
              {doc.file && (
                <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument(doc.type)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-md ${
              doc.status === "completed" ? "bg-green-50 text-green-700" :
              doc.status === "error" ? "bg-red-50 text-red-700" :
              "bg-yellow-50 text-yellow-700"
            }`}>
              {doc.status}
            </span>
          </div>
        ))}

        <Button type="submit" disabled={isUploading} className="mt-4 w-full">
          {isUploading ? "Uploading..." : "Upload Documents"}
        </Button>
      </form>
    </div>
  );
};

export default UploadDocuments;
