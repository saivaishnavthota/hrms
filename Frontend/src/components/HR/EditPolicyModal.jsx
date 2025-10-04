import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import api from "@/lib/api";

const EditPolicyModal = ({ isOpen, onClose, policy, locations, onUpdated }) => {
  const [sections, setSections] = useState([]);
  const [locationId, setLocationId] = useState(policy.location_id);

  useEffect(() => {
    setSections(policy.sections_json || []);
    setLocationId(policy.location_id);
  }, [policy]);

  const handleSectionChange = (index, key, value) => {
    const updated = [...sections];
    updated[index][key] = value;
    setSections(updated);
  };

  const addSection = () => setSections([...sections, { heading: "", content: "" }]);

  const handleSave = async () => {
    try {
      await api.put(`/policies/edit/${policy.id}`, {
        sections_json: sections,
        location_id: locationId,
      });
      toast.success("Policy updated!");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Update failed.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Edit Policy: {policy.file_name}
        </h2>

        {/* Location */}
        <div className="mb-4">
          <label className="block mb-1">Location</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sections */}
        <div className="mb-4">
          {sections.map((s, idx) => (
            <div key={idx} className="mb-2 border-b pb-2">
              <input
                type="text"
                value={s.heading}
                placeholder="Heading"
                onChange={(e) => handleSectionChange(idx, "heading", e.target.value)}
                className="w-full p-2 border rounded mb-1"
              />
              <textarea
                value={s.content}
                placeholder="Content"
                onChange={(e) => handleSectionChange(idx, "content", e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
          <Button onClick={addSection} className="mt-2">
            Add Section
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default EditPolicyModal;
