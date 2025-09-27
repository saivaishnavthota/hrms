import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import ViewLeaveApplication from '../HR/ViewLeaveApplication';

const ManagerLeaveRequests = () => {
  const { user } = useUser();
  const managerId = useMemo(() => {
    return user?.employeeId || JSON.parse(localStorage.getItem('userData') || '{}')?.employeeId || 1; // fallback for dev
  }, [user]);

  const [activeTab, setActiveTab] = useState('pending');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Fetch manager pending requests
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://127.0.0.1:8000/leave/manager/pending-leaves/${managerId}`);
      const mapped = (response.data || []).map((item) => ({
        id: item.id,
        employee: item.employee_name,
        leaveType: item.leave_type,
        startDate: item.start_date,
        endDate: item.end_date,
        days: item.no_of_days,
        status: (item.manager_status || 'Pending').toLowerCase(),
        appliedOn: item.created_at || item.start_date,
        reason: item.reason,
        manager_status: item.manager_status,
        hr_status: item.hr_status,
        final_status: item.status,
      }));
      setPendingRequests(mapped);
    } catch (err) {
      console.error('Error fetching manager pending leaves:', err);
      setError('Failed to fetch pending requests.');
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch manager all leave requests
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://127.0.0.1:8000/leave/leave-requests/${managerId}`);
      const mapped = (response.data || []).map((item) => ({
        id: item.leave_id ?? item.id,
        employee: item.employee_name,
        leaveType: item.leave_type,
        startDate: item.start_date,
        endDate: item.end_date,
        days: item.no_of_days,
        status: (item.manager_status || item.final_status || 'Pending').toLowerCase(),
        appliedOn: item.created_at || item.start_date,
        reason: item.reason,
        manager_status: item.manager_status,
        hr_status: item.hr_status,
        final_status: item.status,
      }));
      setLeaveRequests(mapped);
    } catch (err) {
      console.error('Error fetching manager leave requests:', err);
      setError('Failed to fetch leave requests.');
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') fetchPendingRequests();
    else fetchLeaveRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, managerId]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? (
        <ChevronUp className="w-4 h-4 inline ml-1" />
      ) : (
        <ChevronDown className="w-4 h-4 inline ml-1" />
      );
    }
    return null;
  };

  const sortedData = (data) => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
  };

  const handleApproveReject = async (leaveId, action) => {
    try {
      setActionLoading((prev) => ({ ...prev, [leaveId]: action }));
      await axios.post(`http://127.0.0.1:8000/leave/manager/leave-action/${leaveId}`, { action });
      await fetchPendingRequests();
    } catch (err) {
      console.error(`Error ${action.toLowerCase()} leave:`, err);
      setError(`Failed to ${action.toLowerCase()} leave.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [leaveId]: null }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Leave Requests</h1>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button
            className={`px-3 py-1 rounded ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('all')}
          >
            All Requests
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="px-6 py-10 text-center text-gray-600">Loading...</div>
        ) : error ? (
          <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('employee')} className="flex items-center">
                      Employee {getSortIcon('employee')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('leaveType')} className="flex items-center">
                      Leave Type {getSortIcon('leaveType')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData(activeTab === 'pending' ? pendingRequests : leaveRequests).map((req, idx) => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.employee}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.leaveType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.startDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.endDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.days}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        req.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : req.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                          onClick={() => handleViewLeave(req)}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {activeTab === 'pending' && (
                          <>
                            <button
                              className={`px-2 py-1 rounded text-white ${actionLoading[req.id] === 'Approved' ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
                              onClick={() => handleApproveReject(req.id, 'Approved')}
                              disabled={!!actionLoading[req.id]}
                            >
                              Approve
                            </button>
                            <button
                              className={`px-2 py-1 rounded text-white ${actionLoading[req.id] === 'Rejected' ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
                              onClick={() => handleApproveReject(req.id, 'Rejected')}
                              disabled={!!actionLoading[req.id]}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ViewLeaveApplication leave={selectedLeave} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default ManagerLeaveRequests;