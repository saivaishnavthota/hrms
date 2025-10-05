import React from "react";
import { X, FileText, Download } from "lucide-react";

const ViewPolicyModal = ({ isOpen, onClose, policy }) => {
  if (!isOpen || !policy) return null;

  const handleDownload = () => {
    window.open(policy.file_url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-white" />
            <h2 className="text-2xl font-bold text-white">
              {policy.file_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Download Button */}
          <div className="flex justify-end">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Policy
            </button>
          </div>

          {/* Sections */}
          {policy.sections_json && policy.sections_json.length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
                Policy Sections
              </h3>
              {policy.sections_json.map((section, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600"
                >
                  <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">
                    {section.heading}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No sections have been added to this policy yet.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Download the file to view the full policy document.
              </p>
            </div>
          )}

          {/* Policy Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Uploaded:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {new Date(policy.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Last Updated:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {new Date(policy.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPolicyModal;
