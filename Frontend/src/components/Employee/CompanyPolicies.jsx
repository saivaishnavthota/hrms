import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { FileText, Download, Calendar, Eye } from "lucide-react";
import ViewPolicyModal from "../HR/ViewPolicyModal";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useUser } from "@/contexts/UserContext";

const CompanyPolicies = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewPolicy, setViewPolicy] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    fetchPoliciesByLocation();
  }, []);

  const fetchPoliciesByLocation = async () => {
    setLoading(true);
    try {
      const locationId = user?.location_id;
      const employeeId = user?.employeeId;
      if (!locationId || !employeeId) {
        throw new Error("Missing location or employee id");
      }
      const query = new URLSearchParams({ employee_id: employeeId }).toString();
      const res = await api.get(`/policies/${locationId}?${query}`);
      setCategories(res.data?.categories || []);
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

  const handleDownload = (policy) => {
    const locationId = user?.location_id;
    const employeeId = user?.employeeId;
    const query = new URLSearchParams({ employee_id: employeeId }).toString();
    window.open(`/policies/download/${policy.id}?${query}`);
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

        {/* Policies Accordion by Category */}
        {(!categories || categories.length === 0) ? (
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
          <Accordion type="single" collapsible className="space-y-4">
            {categories.map((cat) => (
              <AccordionItem key={cat.category_id} value={String(cat.category_id)}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.category_icon}</span>
                    <span className="text-lg font-semibold">{cat.category_name}</span>
                    <span className="ml-2 text-sm text-gray-500">({cat.count} policies)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {(!cat.policies || cat.policies.length === 0) ? (
                    <p className="text-gray-500 dark:text-gray-400">No policies in this category</p>
                  ) : (
                    <div className="space-y-3">
                      {cat.policies.map((policy) => (
                        <div key={policy.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <h4 className="font-medium text-gray-900 dark:text-white">{policy.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{policy.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Created: {new Date(policy.created_at).toLocaleDateString()}</span>
                              {policy.attachment_type && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {policy.attachment_type.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewClick(policy)}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                              title="View Policy"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {policy.attachment_type && (
                              <button
                                onClick={() => handleDownload(policy)}
                                className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                                title="Download Attachment"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
