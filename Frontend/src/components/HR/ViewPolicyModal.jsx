import React from "react";

const ViewPolicyModal = ({ isOpen, onClose, policy }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {policy.file_name}
        </h2>

        {(policy.sections_json || []).map((s, idx) => (
          <div key={idx} className="mb-4 border-b pb-2">
            <h3 className="font-semibold">{s.heading}</h3>
            <p>{s.content}</p>
          </div>
        ))}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPolicyModal;
