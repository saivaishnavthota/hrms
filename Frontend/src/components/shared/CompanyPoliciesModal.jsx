import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { FileText, Download, X, Eye } from "lucide-react";
import ViewPolicyModal from "../HR/ViewPolicyModal";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useUser } from "@/contexts/UserContext";

const CompanyPoliciesModal = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewPolicy, setViewPolicy] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    if (isOpen) {
      fetchPoliciesByLocation();
    }
  }, [isOpen, user]);

  const fetchPoliciesByLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get location_id and employeeId with fallback to localStorage
      let locationId = user?.location_id;
      let employeeId = user?.employeeId;

      // Fallback to localStorage if user context is not loaded yet
      if (!locationId || !employeeId) {
        try {
          const storedUser = localStorage.getItem('userData');
          const userData = storedUser ? JSON.parse(storedUser) : null;
          locationId = locationId || userData?.location_id;
          employeeId = employeeId || userData?.employeeId;
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }

      // Also try legacy storage for employeeId
      if (!employeeId) {
        employeeId = localStorage.getItem('userId');
      }

      // Handle missing employeeId
      if (!employeeId) {
        console.error("Missing employeeId");
        setError("Unable to identify your account. Please log in again.");
        return;
      }

      // Handle missing location_id
      if (!locationId) {
        console.error("Missing location_id for user:", employeeId);
        setError("no_location");
        return;
      }

      const query = new URLSearchParams({ employee_id: employeeId }).toString();
      const res = await api.get(`/policies/${locationId}?${query}`);
      
      console.log('API Response:', res.data);
      console.log('Categories:', res.data?.categories);
      
      // Parse policies if they come as JSON strings
      const categories = (res.data?.categories || []).map(cat => {
        let policies = cat.policies;
        
        // Handle if policies is a string
        if (typeof policies === 'string') {
          try {
            policies = JSON.parse(policies);
          } catch (e) {
            console.error('Error parsing policies:', e);
            policies = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(policies)) {
          policies = [];
        }
        
        return {
          ...cat,
          policies: policies
        };
      });
      
      console.log('Processed categories:', categories);
      setCategories(categories);
    } catch (err) {
      console.error("Error fetching policies:", err);
      setError("Failed to fetch company policies. Please try again later.");
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
    let employeeId = user?.employeeId;
    
    // Fallback to localStorage
    if (!employeeId) {
      try {
        const storedUser = localStorage.getItem('userData');
        const userData = storedUser ? JSON.parse(storedUser) : null;
        employeeId = userData?.employeeId || localStorage.getItem('userId');
      } catch (e) {
        console.error('Error getting employee ID:', e);
      }
    }
    
    if (!employeeId) {
      toast.error("Unable to download. Missing employee information.");
      return;
    }
    
    const query = new URLSearchParams({ employee_id: employeeId }).toString();
    window.open(`/policies/download/${policy.id}?${query}`);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Company Policies</h2>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading policies...</p>
                </div>
              </div>
            ) : error === "no_location" ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border-2 border-yellow-400">
                <FileText className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Location Not Assigned
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  You haven't been assigned to a location yet. Please contact your HR department to assign you to a location so you can access company policies.
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border-2 border-red-400">
                <FileText className="h-20 w-20 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Error Loading Policies
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-4">
                  {error}
                </p>
                <button
                  onClick={fetchPoliciesByLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (!categories || categories.length === 0) ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <FileText className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Policies Available
                </h3>
                <p className="text-gray-500">
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
                        <span className="ml-2 text-sm text-gray-500">
                          ({cat.count} {cat.count === 1 ? 'policy' : 'policies'})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {(!cat.policies || !Array.isArray(cat.policies) || cat.policies.length === 0) ? (
                        <p className="text-gray-500 p-4">No policies in this category</p>
                      ) : (
                        <div className="space-y-3">
                          {cat.policies.map((policy) => (
                            <div key={policy.id} className="p-4 bg-white rounded-lg border border-gray-200 flex items-start justify-between hover:shadow-md transition-shadow">
                              <div className="flex-1 pr-4">
                                <h4 className="font-medium text-gray-900">{policy.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>Created: {new Date(policy.created_at).toLocaleDateString()}</span>
                                  {policy.attachment_type && (
                                    <span className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      {policy.attachment_type.toUpperCase()}
                                    </span>
                                  )}
                                  <span>By: {policy.uploader_name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewClick(policy)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="View Policy"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {policy.attachment_type && (
                                  <button
                                    onClick={() => handleDownload(policy)}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
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
        </div>
      </div>

      {/* View Modal */}
      {viewPolicy && (
        <ViewPolicyModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          policy={viewPolicy}
        />
      )}
    </>
  );
};

export default CompanyPoliciesModal;

