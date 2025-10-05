import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api";

const EditPolicyModal = ({ isOpen, onClose, policy, onUpdated }) => {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (policy && policy.sections_json) {
      setSections(Array.isArray(policy.sections_json) ? policy.sections_json : []);
    }
  }, [policy]);

  const handleAddSection = () => {
    setSections([...sections, { heading: "", content: "" }]);
  };

  const handleRemoveSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("sections_json", JSON.stringify(sections));

      await api.put(`/policies/edit/${policy.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Policy updated successfully!");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update policy.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit Policy: {policy?.file_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Policy Sections
            </h3>
            <button
              onClick={handleAddSection}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          </div>

          {sections.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No sections yet. Click "Add Section" to create one.
            </p>
          ) : (
            sections.map((section, index) => (
              <div
                key={index}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg space-y-3 bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Section {index + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveSection(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Section Heading"
                  value={section.heading}
                  onChange={(e) =>
                    handleSectionChange(index, "heading", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />

                <textarea
                  placeholder="Section Content"
                  value={section.content}
                  onChange={(e) =>
                    handleSectionChange(index, "content", e.target.value)
                  }
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPolicyModal;
