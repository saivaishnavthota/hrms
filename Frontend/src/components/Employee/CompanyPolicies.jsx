import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { FileText, Download, Calendar, Eye } from "lucide-react";
import ViewPolicyModal from "../HR/ViewPolicyModal";

const CompanyPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewPolicy, setViewPolicy] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    fetchMyPolicies();
  }, []);

  const fetchMyPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.get("/policies/my-policies");
      setPolicies(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch company policies.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (policy) => {
    setViewPolicy(policy);
    setViewModalOpen(true);
  };

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Company Policies
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review important company policies and guidelines
          </p>
        </div>

        {/* Policies Grid */}
        {policies.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <FileText className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Policies Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              There are no company policies uploaded for your location yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white line-clamp-2">
                        {policy.file_name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Policy Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(policy.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Sections Preview */}
                  {policy.sections_json && policy.sections_json.length > 0 ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{policy.sections_json.length}</span>{" "}
                      {policy.sections_json.length === 1 ? "section" : "sections"} available
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      No sections added yet
                    </div>
                  )}
                </div>

                {/* Card Footer - Actions */}
                <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => handleViewClick(policy)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(policy.file_url)}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewPolicy && (
        <ViewPolicyModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          policy={viewPolicy}
        />
      )}
    </div>
  );
};

export default CompanyPolicies;
