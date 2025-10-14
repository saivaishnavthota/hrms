import React, { useState, useEffect } from 'react';
import { softwareRequestAPI } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Check, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { avatarBg } from '../../lib/avatarColors';

const SoftwareRequestCompletion = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState({}); // Track loading state for each action

  const currentUser = getCurrentUser();
  const itAdminId = currentUser?.userId;

  const getAvatarColor = (name) => avatarBg(name);

  const getInitials = (name) => {
    if (!name) return 'NA';
    const parts = name.trim().split(' ');
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase();
  };

  useEffect(() => {
    if (!itAdminId) {
      setError('User not authenticated. Please log in.');
      return;
    }

    const fetchRequests = async () => {
      try {
        const requestsData = await softwareRequestAPI.getSoftwareRequests();
        setRequests(
          requestsData
            .filter((req) => req.it_admin_id === parseInt(itAdminId) && req.status === 'Approved')
            .map((req, index) => ({
              id: index + 1, // Static ID for display
              requestId: req.id, // Backend ID for API calls
              employee: {
                name: req.employee_name || req.employee_id || 'Unknown',
                email: req.employee_email || 'N/A',
                avatar: getInitials(req.employee_name || 'U'),
              },
              manager: {
                name: req.manager_name || req.manager_id || 'Unknown',
                email: req.manager_email || 'N/A',
                avatar: getInitials(req.manager_name || 'U'),
              },
              software_name: req.software_name,
              software_version: req.software_version || 'N/A',
              additional_info: req.additional_info || 'N/A',
              status: req.status,
            }))
        );
      } catch (err) {
        setError('Failed to fetch software requests. Please try again.');
      }
    };
    fetchRequests();
  }, [itAdminId]);

  const handleComplete = async (requestId) => {
    if (!itAdminId) {
      setError('User not authenticated. Please log in.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    setError('');

    try {
      await softwareRequestAPI.completeSoftwareRequest(requestId);
      toast.success('Software request marked as Completed successfully!');
      setRequests((prev) => prev.filter((req) => req.requestId !== requestId));
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to complete software request.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Software Request Completion</h1>
          <p className="text-gray-600 mt-1">Complete approved software requests</p>
        </div>
      </div>

      {/* Error Messages */}
      {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {requests.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-600">No approved software requests to complete.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">EMPLOYEE</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">SOFTWARE</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">VERSION</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">ADDITIONAL INFO</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">MANAGER</TableHead>
                {/* <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">STATUS</TableHead> */}
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="text-center text-gray-600 px-6 py-4">{req.id}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${getAvatarColor(req.employee.name)} flex items-center justify-center text-white font-medium text-sm`}
                      >
                        {req.employee.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{req.employee.name}</div>
                        <div className="text-sm text-gray-500">{req.employee.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-700">{req.software_name}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-700">{req.software_version}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-700">{req.additional_info}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${getAvatarColor(req.manager.name)} flex items-center justify-center text-white font-medium text-sm`}
                      >
                        {req.manager.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{req.manager.name}</div>
                        <div className="text-sm text-gray-500">{req.manager.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  {/* <TableCell className="px-6 py-4">{getStatusBadge(req.status)}</TableCell> */}
                  <TableCell className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                      onClick={() => handleComplete(req.requestId)}
                      disabled={actionLoading[req.requestId]}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default SoftwareRequestCompletion;