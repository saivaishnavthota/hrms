import React from 'react';
import { X, Calendar, User, FileText, Clock } from 'lucide-react';

const ViewLeaveApplication = ({ isOpen, onClose, leaveData }) => {
  if (!isOpen || !leaveData) return null;

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${
          statusClasses[status] || "bg-gray-100 text-gray-800 border-gray-200"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Leave Application Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employee Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Employee Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                <p className="text-gray-900">{leaveData.employee || leaveData.employee_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <p className="text-gray-900">{leaveData.employee_id || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Leave Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <p className="text-gray-900">{leaveData.leaveType || leaveData.leave_type || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div>{getStatusBadge(leaveData.status || 'pending')}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <p className="text-gray-900">{formatDate(leaveData.startDate || leaveData.start_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <p className="text-gray-900">{formatDate(leaveData.endDate || leaveData.end_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days</label>
                <p className="text-gray-900">{leaveData.days || leaveData.total_days || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applied On</label>
                <p className="text-gray-900">{formatDate(leaveData.appliedOn || leaveData.applied_date || leaveData.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          {(leaveData.reason || leaveData.description) && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Reason for Leave</h3>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap">
                {leaveData.reason || leaveData.description || 'No reason provided'}
              </p>
            </div>
          )}

          {/* Additional Information */}
          {(leaveData.emergencyContact || leaveData.handoverNotes || leaveData.comments) && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
              </div>
              <div className="space-y-3">
                {leaveData.emergencyContact && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                    <p className="text-gray-900">{leaveData.emergencyContact}</p>
                  </div>
                )}
                {leaveData.handoverNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Handover Notes</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{leaveData.handoverNotes}</p>
                  </div>
                )}
                {leaveData.comments && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{leaveData.comments}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval Information */}
          {(leaveData.approved_by || leaveData.rejected_by || leaveData.manager_comments) && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">Approval Information</h3>
              </div>
              <div className="space-y-3">
                {leaveData.approved_by && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
                    <p className="text-gray-900">{leaveData.approved_by}</p>
                  </div>
                )}
                {leaveData.rejected_by && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rejected By</label>
                    <p className="text-gray-900">{leaveData.rejected_by}</p>
                  </div>
                )}
                {leaveData.manager_comments && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manager Comments</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{leaveData.manager_comments}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewLeaveApplication;
