import React, { useState, useEffect , useMemo} from 'react';
import { Eye, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import ViewLeaveApplication from './ViewLeaveApplication';
import PendingRequests from './PendingRequests';
import { useUser } from '@/contexts/UserContext';
import { avatarBg } from '../../lib/avatarColors';
import { markDeleted, filterListByDeleted } from '../../lib/localDelete';
import api from '@/lib/api';
import { toast } from "react-toastify";


const LeaveRequests = () => {
  const { user } = useUser();
  const hrId = useMemo(() => {
    return user?.employeeId || JSON.parse(localStorage.getItem('userData') || '{}')?.employeeId || 1; // fallback for dev
  }, [user]);

  const [activeTab, setActiveTab] = useState('pending');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

   const getAvatarColor = (name) => avatarBg(name);

  // Fetch HR leave requests
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/leave/hr/leave-requests/${hrId}`);
      const mapped = (response.data || []).map((item) => ({
        id: item.leave_id ?? item.id,
        employee: item.employee_name,
        leaveType: item.leave_type,
        startDate: item.start_date,
        endDate: item.end_date,
        days: item.no_of_days,
        status: (item.manager_status || item.final_status || 'Pending').toLowerCase(),
        appliedOn: item.created_at || item.start_date,
        reason:item.reason,
        manager_status: item.manager_status,
        hr_status: item.hr_status,
        final_status: item.status,
      }));
      setLeaveRequests(filterListByDeleted('leaveRequests', mapped));
    } catch (err) {
      console.error('Error fetching HR leave requests:', err);
      toast.error('Failed to fetch leave requests. Please try again.');
      // Fallback sample data for development
     
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    if (activeTab === 'pending') fetchLeaveRequests();
    else fetchLeaveRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hrId]);
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? 
        <ChevronUp className="w-4 h-4 inline ml-1" /> : 
        <ChevronDown className="w-4 h-4 inline ml-1" />;
    }
    return <ChevronUp className="w-4 h-4 inline ml-1 opacity-30" />;
  };

  const getLeaveTypeColor = (leaveType) => {
    switch (leaveType) {
      case 'Annual Leave':
        return 'text-green-600';
      case 'Sick Leave':
        return 'text-orange-600';
      case 'Casual Leave':
        return 'text-purple-600';
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
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status.toLowerCase()) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const sortedRequests = React.useMemo(() => {
    const data = [...leaveRequests];
    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [leaveRequests, sortConfig]);

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => setActiveTab('leave-requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'leave-requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Leave Requests
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' ? (
        <PendingRequests />
      ) : (
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="px-6 py-10 text-center text-gray-600">Loading leave requests...</div>
          ) : error ? (
            <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{error}</div>
          ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
               
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('startDate')}
                >
                  Start Date {getSortIcon('startDate')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('endDate')}
                >
                  End Date {getSortIcon('endDate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('appliedOn')}
                >
                  Applied On {getSortIcon('appliedOn')}
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
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAvatarColor(request.employee)} flex items-center justify-center`}>
                        <span className="text-sm font-medium text-white">
                          {request.employee.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    
                     <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{request.employee}</div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                      </div>
                        </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getLeaveTypeDot(request.leaveType)}`}></div>
                      <span className={`text-sm font-medium ${getLeaveTypeColor(request.leaveType)}`}>
                        {request.leaveType}
                      </span>
                    </div>
                  </td>

      
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.startDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.endDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.days}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(request.status)}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.appliedOn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                        onClick={() => handleViewLeave(request)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete"
                        onClick={() => {
                          try {
                            markDeleted('leaveRequests', request.id);
                          } catch (e) {
                            console.error('Error marking leave request deleted locally:', e);
                          }
                          setLeaveRequests(prev => prev.filter(r => r.id !== request.id));
                        }}
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">9</span> of{' '}
              <span className="font-medium">9</span> results
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* View Leave Application Modal */}
      <ViewLeaveApplication
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        leaveData={selectedLeave}
      />
    </div>
  );
};

export default LeaveRequests;