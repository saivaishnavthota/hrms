import React from 'react';
import { X, Calendar, User, FileText, Clock } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const ViewLeaveApplication = ({ isOpen, onClose, leaveData }) => {
  const { user } = useUser();
  
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
    <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
          <h2 className="text-xl font-semibold text-white">Leave Application Details</h2>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employee Information */}
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 ring-1 ring-blue-200">
                <User className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-medium text-gray-900">Employee Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                <p className="text-gray-900">
                  {leaveData.employee || leaveData.employee_name || user?.name || 'N/A'}
                </p>
              </div>
              
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200">
                <Calendar className="w-4 h-4" />
              </span>
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
                <p className="text-gray-900">{leaveData.no_of_days || leaveData.days || leaveData.total_days || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applied On</label>
                <p className="text-gray-900">{formatDate(leaveData.created_at || leaveData.appliedOn || leaveData.applied_date)}</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          {(leaveData.reason || leaveData.description) && (
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 ring-1 ring-green-200">
                  <FileText className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-medium text-gray-900">Reason for Leave</h3>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap">
                {leaveData.reason || leaveData.description || 'No reason provided'}
              </p>
            </div>
          )}

          {/* Additional Information */}
          {(leaveData.emergencyContact || leaveData.handoverNotes || leaveData.comments) && (
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 ring-1 ring-yellow-200">
                  <Clock className="w-4 h-4" />
                </span>
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
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 ring-1 ring-purple-200">
                  <User className="w-4 h-4" />
                </span>
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
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white/60 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewLeaveApplication;
