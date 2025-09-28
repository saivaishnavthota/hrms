import React, { useState, useMemo,useEffect } from 'react';
import { Eye, Trash2, ChevronUp, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import ViewLeaveApplication from './ViewLeaveApplication';
import { useUser } from '@/contexts/UserContext';
import { avatarBg } from '../../lib/avatarColors';
const PendingRequests = () => {
  
   const { user } = useUser();
  const hrId = useMemo(() => {
    return user?.employeeId || JSON.parse(localStorage.getItem('userData') || '{}')?.employeeId || 1; // fallback for dev
  }, [user]);
  // Default hrId for testing
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});


   const getAvatarColor = (name) => avatarBg(name);
  
  // Fetch pending requests from backend
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:8000/leave/hr/pending-leaves/${hrId}`);
      
      // Map backend response to frontend format
      const mapped= response.data.map(item => ({
        id: item.id,
        employee: item.employee_name,
        leaveType: item.leave_type,
        
        startDate: item.start_date,
        
        endDate: item.end_date,
       
        days: item.no_of_days,
        
        status: (item.hr_status || 'Pending').toLowerCase(),
        appliedOn: item.created_at ||  item.start_date,
        applied_date: item.created_at,
        reason: item.reason,
        description: item.reason,
        manager_status: item.manager_status,
        hr_status: item.hr_status,
        final_status: item.status
      }));
      
      setPendingRequests(mapped);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setError('Failed to fetch pending requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on mount and when HR ID changes
  useEffect(() => {
    fetchPendingRequests();
  }, [hrId]);

  

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleViewLeave = (request) => {
    setSelectedLeave(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
  };

  const handleApproveReject = async (requestId, action) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [requestId]: action === 'Approved' ? 'approving' : 'rejecting',
      }));
      await axios.post(`http://localhost:8000/leave/hr/leave-action/${requestId}`, {
        action, // Backend expects 'Approved' or 'Rejected'
      });

      // Refresh the pending requests list
      await fetchPendingRequests();

      // Success message for debugging/notifications
      console.log(`Leave request ${action.toLowerCase()} successfully`);
    } catch (err) {
      console.error(`Error ${action.toLowerCase()} leave request:`, err);
      setError(`Failed to ${action.toLowerCase()} leave request. Please try again.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: null }));
    }
  };

  // const handleReject = async (requestId) => {
  //   try {
  //     setActionLoading(prev => ({ ...prev, [requestId]: 'rejecting' }));
  //     await axios.post(`http://localhost:8000/leave/hr/leave-action/${requestId}`, {
  //       action: 'Rejected'  // Backend expects 'Rejected' with capital R
  //     });
      
  //     // Refresh the pending requests list
  //     await fetchPendingRequests();
      
  //     // Show success message (you can add a toast notification here)
  //     console.log('Leave request rejected successfully');
  //   } catch (err) {
  //     console.error('Error rejecting leave request:', err);
  //     setError('Failed to reject leave request. Please try again.');
  //   } finally {
  //     setActionLoading(prev => ({ ...prev, [requestId]: null }));
  //   }
  // };

  const sortedRequests = React.useMemo(() => {
    let sortableRequests = [...pendingRequests];
    if (sortConfig.key) {
      sortableRequests.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRequests;
  }, [pendingRequests, sortConfig]);

  const getSortIcon = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? 
        <ChevronUp className="w-4 h-4" /> : 
        <ChevronDown className="w-4 h-4" />;
    }
    return <ChevronUp className="w-4 h-4 opacity-30" />;
  };

  // Match LeaveRequests visual styling for leave type chips
  const getLeaveTypeColor = (leaveType) => {
    switch (leaveType) {
      case 'Annual Leave':
        return 'text-green-600';
      case 'Sick Leave':
        return 'text-orange-600';
      case 'Casual Leave':
        return 'text-purple-600';
       case 'Maternity Leave':
        return 'text-red-600';
      case 'Paternity Leave':
        return 'text-brown-600';
      default:
        return 'text-gray-600';

    }
  };

  const getLeaveTypeDot = (leaveType) => {
    switch (leaveType) {
      case 'Annual Leave':
        return 'bg-green-500';
      case 'Sick Leave':
        return 'bg-orange-500';
      case 'Casual Leave':
        return 'bg-purple-500';
       case 'Maternity Leave':
        return 'bg-red-500';
      case 'Paternity Leave':
        return 'bg-brown-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Helper function to get display value with fallback
  const getDisplayValue = (item, primaryKey, fallbackKey) => {
    return item[primaryKey] || item[fallbackKey] || 'N/A';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading pending requests...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchPendingRequests}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Pending Leave Requests</h2>
          <p className="mt-1 text-sm text-gray-600">
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''} awaiting your approval
          </p>
        </div>
        
        {pendingRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Check className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
            <p className="text-gray-600">All leave requests have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('employee')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Employee</span>
                      {getSortIcon('employee')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('leaveType')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Leave Type</span>
                      {getSortIcon('leaveType')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('startDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Start Date</span>
                      {getSortIcon('startDate')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('endDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>End Date</span>
                      {getSortIcon('endDate')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('days')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Days</span>
                      {getSortIcon('days')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('appliedOn')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Applied On</span>
                      {getSortIcon('appliedOn')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAvatarColor(getDisplayValue(request, 'employee', 'employee_name'))} flex items-center justify-center`}>
                          <span className="text-sm font-medium text-white">
                            {getDisplayValue(request, 'employee', 'employee_name').split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{getDisplayValue(request, 'employee', 'employee_name')}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${getLeaveTypeDot(getDisplayValue(request, 'leaveType', 'leave_type'))}`}></div>
                        <span className={`text-sm font-medium ${getLeaveTypeColor(getDisplayValue(request, 'leaveType', 'leave_type'))}`}>
                          {getDisplayValue(request, 'leaveType', 'leave_type')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(getDisplayValue(request, 'startDate', 'start_date')).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(getDisplayValue(request, 'endDate', 'end_date')).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDisplayValue(request, 'days', 'total_days')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(getDisplayValue(request, 'appliedOn', 'applied_date')).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewLeave(request)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApproveReject(request.id, 'Approved')}
                          disabled={actionLoading[request.id]}
                          className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 disabled:opacity-50"
                          title="Approve"
                        >
                          {actionLoading[request.id] === 'approving' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleApproveReject(request.id, 'Rejected')}
                          disabled={actionLoading[request.id]}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 disabled:opacity-50"
                          title="Reject"
                        >
                          {actionLoading[request.id] === 'rejecting' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => console.log('Delete request:', request.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Leave Application Modal */}
      <ViewLeaveApplication
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        leaveData={selectedLeave}
      />
    </div>
  );
};

export default PendingRequests;