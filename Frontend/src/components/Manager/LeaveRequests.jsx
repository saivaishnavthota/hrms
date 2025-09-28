import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Eye, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import ViewLeaveApplication from '../HR/ViewLeaveApplication';
import { avatarBg } from '../../lib/avatarColors';

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
        employeeEmail:item.employee_email,
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

   const getAvatarColor = (name) => avatarBg(name);


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600 mt-1">Review and take action on team leave requests</p>
        </div>
      </div>

      <div className="mb-2">
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
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Leave Requests
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="px-6 py-10 text-center text-gray-600">Loading...</div>
        ) : error ? (
          <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    <button onClick={() => handleSort('employee')} className="flex items-center">
                      Employee {getSortIcon('employee')}
                    </button>
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    <button onClick={() => handleSort('leaveType')} className="flex items-center">
                      Leave Type {getSortIcon('leaveType')}
                    </button>
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">Start</th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">End Date</th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">Days</th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">Status</th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedData(activeTab === 'pending' ? pendingRequests : leaveRequests).map((req, idx) => (
                  <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="text-center text-gray-600 px-6 py-4">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(req.employee)} flex items-center justify-center text-white font-medium text-sm`}>
                          {req.employee.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{req.employee}</div>
                          <div className="text-sm text-gray-500">
                            <span>{req.employeeEmail}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{req.leaveType}</td>
                    <td className="px-6 py-4 text-gray-700">{req.startDate}</td>
                    <td className="px-6 py-4 text-gray-700">{req.endDate}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{req.days}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          req.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : req.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 rounded-md"
                          title="View"
                          onClick={() => handleViewLeave(req)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 rounded-md"
                          onClick={() => handleApproveReject(req.id, 'Approved')}
                          disabled={!!actionLoading[req.id] || req.status !== 'pending'}
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 rounded-md"
                          onClick={() => handleApproveReject(req.id, 'Rejected')}
                          disabled={!!actionLoading[req.id] || req.status !== 'pending'}
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
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

      <ViewLeaveApplication
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        leaveData={selectedLeave}
      />
    </div>
  );
};

export default ManagerLeaveRequests;