import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import EditPolicyModal from "./EditPolicyModal";
import ViewPolicyModal from "./ViewPolicyModal";

const AddCompanyPolicy = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [policies, setPolicies] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editPolicy, setEditPolicy] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewPolicy, setViewPolicy] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch locations on mount
  useEffect(() => {
  const fetchLocations = async () => {
    try {
      const res = await api.get("/locations/");
      setLocations(res.data.data || []); // <-- access the nested 'data'
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch locations.");
    }
  };
  fetchLocations();
}, []);


  // Fetch policies when location is selected
  const fetchPolicies = async (locationId) => {
    if (!locationId) return;
    try {
      const res = await api.get(`/policies/list?location_id=${locationId}`);
      setPolicies(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch policies.");
    }
  };

  const handleLocationChange = (e) => {
    const locId = e.target.value;
    setSelectedLocationId(locId);
    fetchPolicies(locId);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Upload new policy for selected location
  // Upload handler
const handleUpload = async (e) => {
  e.preventDefault(); // Prevent page reload
  if (!selectedFile) return toast.error("Please select a file.");
  if (!selectedLocationId) return toast.error("Please select a location first.");

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("location_id", selectedLocationId);

  try {
    const res = await api.post("/policies/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success(res.data.message || "Policy uploaded successfully!");
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    fetchPolicies(selectedLocationId); // Refresh the list after upload
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.detail || "Upload failed.");
  }
};

  const handleDelete = async (policyId) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    try {
      await api.delete(`/policies/delete/${policyId}`);
      toast.success("Policy deleted!");
      fetchPolicies(selectedLocationId);
    } catch (err) {
      console.error(err);
      toast.error("Delete failed.");
    }
  };

  const handleEditClick = (policy) => {
    setEditPolicy(policy);
    setEditModalOpen(true);
  };

  const handleViewClick = (policy) => {
    setViewPolicy(policy);
    setViewModalOpen(true);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
        Company Policies (HR)
      </h1>

      {/* Location Dropdown */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Select Location:</label>
        <select
          className="border p-2 rounded"
          value={selectedLocationId}
          onChange={handleLocationChange}
        >
          <option value="">-- Select Location --</option>
          {Array.isArray(locations) &&
            locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
        </select>
      </div>

      {/* Upload Section */}
      <div className="mb-6 flex gap-2 items-center">
        <input type="file" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Upload New Policy
        </button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 gap-6">
        {(policies || []).map((policy) => (
          <div
            key={policy.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
          >
            <h3 className="text-xl font-semibold mb-2">{policy.file_name}</h3>

            {(policy.sections_json || []).length > 0 ? (
              <div className="mb-2">
                {policy.sections_json.map((s, idx) => (
                  <div key={idx} className="mb-1">
                    <strong>{s.heading}:</strong> {s.content}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No sections yet.</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                className="bg-green-500 text-white px-3 py-1 rounded"
                onClick={() => handleViewClick(policy)}
              >
                View
              </button>
              <button
                className="bg-yellow-500 text-white px-3 py-1 rounded"
                onClick={() => handleEditClick(policy)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => handleDelete(policy.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {editPolicy && (
        <EditPolicyModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          policy={editPolicy}
          onUpdated={() => fetchPolicies(selectedLocationId)}
        />
      )}
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

export default AddCompanyPolicy;