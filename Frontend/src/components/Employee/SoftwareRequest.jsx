import React, { useEffect, useState } from 'react';
import { softwareRequestAPI } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Search, CheckCircle, Clock, XCircle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const SoftwareRequest = () => {
  const [requests, setRequests] = useState([]);
  const [managers, setManagers] = useState([]);
  const [itAdmins, setItAdmins] = useState([]);
  const [formData, setFormData] = useState({
    software_name: '',
    software_version: '',
    additional_info: '',
    manager_id: '',
    it_admin_id: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage] = useState('10');
  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const currentUser = getCurrentUser();
  const employeeId = currentUser?.userId;

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const mapStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return status || 'Pending';
    }
  };

  const mapRequest = (item, index) => ({
    id: index + 1, // Static ID starting from 1
    requestId: item.id, // Backend ID for API calls
    software_name: item.software_name,
    software_version: item.software_version || 'N/A',
    additional_info: item.additional_info || '',
    submitted_on: formatDate(item.created_at),
    status: mapStatus(item.status),
  });

  useEffect(() => {
    if (!employeeId) {
      toast.error('User not authenticated. Please log in.');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [managersData, adminsData, requestsData] = await Promise.all([
          softwareRequestAPI.getEmployeeManagers(employeeId),
          softwareRequestAPI.getItAdmins(),
          softwareRequestAPI.getSoftwareRequests(),
        ]);
        setManagers(managersData);
        setItAdmins(adminsData);
        setRequests(requestsData.filter((req) => req.employee_id === parseInt(employeeId)).map(mapRequest));
      } catch (err) {
        console.error('Fetch data failed:', err);
        toast.error('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    setFormSubmitting(true);

    if (!employeeId) {
        toast.error('User not authenticated. Please log in.');
        setFormSubmitting(false);
        return;
    }

    try {
        const response = await softwareRequestAPI.createSoftwareRequest({
            ...formData,
            employee_id: employeeId,
        });
        console.log('Create Software Request Response:', response);
        const newRequest = mapRequest(response, requests.length);
        setRequests([...requests, newRequest]);
        toast.success('Software request created successfully!');
        setFormData({
            software_name: '',
            software_version: '',
            additional_info: '',
            manager_id: '',
            it_admin_id: '',
        });
    } catch (err) {
        console.error('Create Software Request Error:', err.response || err);
        const errorMessage = err.response?.data?.detail || 'Failed to create software request.';
        toast.error(errorMessage);
    } finally {
        setFormSubmitting(false);
    }
};

  const filteredRequests = requests.filter((request) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (request.software_name || '').toLowerCase().includes(q) ||
      (request.additional_info || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (request.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
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
          <h1 className="text-2xl font-semibold text-gray-900">Software Request Portal</h1>
          <p className="text-gray-600 mt-1">Submit and manage your software requests</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Per Page:</span>
          <Select value={perPage} onValueChange={setPerPage}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-6">
        {/* New Request Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Software Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Software Name</label>
              <Input
                type="text"
                name="software_name"
                value={formData.software_name}
                onChange={handleInputChange}
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Software Version</label>
              <Input
                type="text"
                name="software_version"
                value={formData.software_version}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Info</label>
              <textarea
                name="additional_info"
                value={formData.additional_info}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                rows="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Manager</label>
              <Select
                name="manager_id"
                value={formData.manager_id}
                onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.name} ({manager.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">IT Admin</label>
              <Select
                name="it_admin_id"
                value={formData.it_admin_id}
                onValueChange={(value) => setFormData({ ...formData, it_admin_id: value })}
                required
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select IT Admin" />
                </SelectTrigger>
                <SelectContent>
                  {itAdmins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id.toString()}>
                      {admin.name} ({admin.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="px-6 py-10 text-center text-gray-600">Loading requests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">SOFTWARE</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">VERSION</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">SUBMITTED ON</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="text-center text-gray-600 px-6 py-4">{request.id}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{request.software_name}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{request.software_version}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{request.submitted_on}</TableCell>
                    <TableCell className="px-6 py-4">{getStatusBadge(request.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredRequests.length} of {requests.length} requests
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SoftwareRequest;