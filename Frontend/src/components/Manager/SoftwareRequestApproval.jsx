import React, { useEffect, useState } from 'react';
import { softwareRequestAPI } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Check, X, CheckCircle, Clock, XCircle, Eye, Plus } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { avatarBg } from '../../lib/avatarColors';
import { useNavigate } from 'react-router-dom';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SoftwareRequestApproval = () => {
  const [requests, setRequests] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [complianceAnswers, setComplianceAnswers] = useState([]);
  const [answersDialogOpen, setAnswersDialogOpen] = useState(false);
  
  // New request form state
  const [formData, setFormData] = useState({
    software_name: '',
    software_version: '',
    additional_info: '',
    it_admin_id: '',
    business_unit_id: 'none',
    software_duration: 'none',
    asset_id: 'none',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [itAdmins, setItAdmins] = useState([]);
  const [locations, setLocations] = useState([]);
  const [managerAssets, setManagerAssets] = useState([]);

  const currentUser = getCurrentUser();
  const managerId = currentUser?.userId;
  const navigate = useNavigate();

  // Pagination
  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    getPaginatedData,
    getTotalPages,
    resetPagination,
  } = usePagination(10);

  const getAvatarColor = (name) => avatarBg(name);

  const getInitials = (name) => {
    if (!name) return 'NA';
    const parts = name.trim().split(' ');
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase();
  };

  // Form handling functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    setFormSubmitting(true);

    if (!managerId) {
      toast.error('User not authenticated. Please log in.');
      setFormSubmitting(false);
      return;
    }

    try {
      // Map 'none' to null for optional fields
      const submitData = {
        ...formData,
        employee_id: managerId, // Manager is creating request for themselves
        manager_id: null, // No manager approval needed for manager's own requests
        business_unit_id: formData.business_unit_id === 'none' ? null : parseInt(formData.business_unit_id),
        software_duration: formData.software_duration === 'none' ? null : formData.software_duration,
        asset_id: formData.asset_id === 'none' ? null : parseInt(formData.asset_id),
      };
      
      const response = await softwareRequestAPI.createSoftwareRequest(submitData);
      toast.success('Software request created successfully!');
      
      // Reset form
      setFormData({
        software_name: '',
        software_version: '',
        additional_info: '',
        it_admin_id: '',
        business_unit_id: 'none',
        software_duration: 'none',
        asset_id: 'none',
      });
      
      // Refresh requests list
      fetchRequests();
    } catch (err) {
      console.error('Create Software Request Error:', err.response || err);
      toast.error(err.response?.data?.detail || 'Failed to create software request.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  useEffect(() => {
    if (!managerId) {
      toast.error('User not authenticated. Please log in.');
      navigate('/login'); // Redirect to login if not authenticated
      return;
    }

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const requestsData = await softwareRequestAPI.getSoftwareRequests('Pending');
        setRequests(
          requestsData
            .filter((req) => req.manager_id === parseInt(managerId))
            .map((req, index) => ({
              id: index + 1,
              requestId: req.id,
              employee: {
                name: req.employee_name || req.employee_id || 'Unknown',
                email: req.employee_email || 'N/A',
                avatar: getInitials(req.employee_name || 'U'),
              },
              software_name: req.software_name,
              software_version: req.software_version || 'N/A',
              additional_info: req.additional_info || 'N/A',
              business_unit_name: req.business_unit_name || 'N/A', // New field
              software_duration: req.software_duration || 'N/A', // New field
              status: req.status,
              compliance_answered: req.compliance_answered,
              created_at: req.created_at,
            }))
        );
      } catch (err) {
        console.error('Fetch requests error:', err);
        toast.error('Failed to fetch software requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const fetchFormData = async () => {
      try {
        const [itAdminsData, locationsData, assetsData] = await Promise.all([
          softwareRequestAPI.getItAdmins(),
          softwareRequestAPI.getLocations(),
          softwareRequestAPI.getEmployeeAssets(managerId)
        ]);
        setItAdmins(itAdminsData);
        setLocations(locationsData);
        setManagerAssets(assetsData);
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error('Failed to load form data');
      }
    };

    fetchRequests();
    fetchFormData();
  }, [managerId, navigate]);

  // Reset pagination when data changes
  useEffect(() => {
    resetPagination();
  }, [requests]);

  // Separate fetchRequests function for reuse
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const requestsData = await softwareRequestAPI.getSoftwareRequests('Pending');
      setRequests(
        requestsData
          .filter((req) => req.manager_id === parseInt(managerId))
          .map((req, index) => ({
            id: index + 1,
            requestId: req.id,
            employee: {
              name: req.employee_name || req.employee_id || 'Unknown',
              email: req.employee_email || 'N/A',
              avatar: getInitials(req.employee_name || 'U'),
            },
            software_name: req.software_name,
            software_version: req.software_version || 'N/A',
            additional_info: req.additional_info || 'N/A',
            business_unit_name: req.business_unit_name || 'N/A',
            software_duration: req.software_duration || 'N/A',
            status: req.status,
            compliance_answered: req.compliance_answered,
            created_at: req.created_at,
          }))
      );
    } catch (err) {
      console.error('Fetch requests error:', err);
      toast.error('Failed to fetch software requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (requestId, value) => {
    setComments((prev) => ({ ...prev, [requestId]: value }));
  };

  const handleAction = async (requestId, action) => {
    if (!managerId) {
      toast.error('User not authenticated. Please log in.');
      navigate('/login');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const comment = comments[requestId] || `Action performed by manager: ${action}`;
      await softwareRequestAPI.managerAction(requestId, action, comment);
      toast.success(`Software request ${action.toLowerCase()} successfully!`);
      setRequests((prev) => prev.filter((req) => req.requestId !== requestId));
      setComments((prev) => {
        const newComments = { ...prev };
        delete newComments[requestId];
        return newComments;
      });
    } catch (err) {
      console.error(`Manager action (${action}) error:`, err);
      toast.error(err.response?.data?.detail || `Failed to ${action.toLowerCase()} software request.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleViewAnswers = async (requestId) => {
    try {
      const answers = await softwareRequestAPI.getComplianceAnswers(requestId);
      setComplianceAnswers(answers);
      setSelectedRequestId(requestId);
      setAnswersDialogOpen(true);
    } catch (err) {
      console.error('Fetch compliance answers error:', err);
      toast.error('Failed to fetch compliance answers.');
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
      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="approvals">Team Requests</TabsTrigger>
          <TabsTrigger value="create-request">Create Request</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-2xl font-semibold text-gray-900">Software Request Approval</h1>
          <p className="text-gray-600 mt-1">Review and manage pending software requests</p>
        </div>
      </div>
      {!loading && requests.length > 0 && (
        <div className="flex justify-end mb-2">
          <PageSizeSelect
            pageSize={pageSize}
            onChange={handlePageSizeChange}
            options={[10, 20, 30, 40, 50]}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="px-6 py-10 text-center text-gray-600">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-600">No pending software requests.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">EMPLOYEE</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">SOFTWARE</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">VERSION</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">BUSINESS UNIT</TableHead> {/* New column */}
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">DURATION</TableHead> {/* New column */}
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">ADDITIONAL INFO</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">COMMENTS</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getPaginatedData(requests).map((req, index) => (
                <TableRow key={req.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="text-center text-gray-600 px-6 py-4">{(currentPage - 1) * pageSize + index + 1}</TableCell>
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
                  <TableCell className="px-6 py-4 text-gray-700">{req.business_unit_name}</TableCell> {/* New column */}
                  <TableCell className="px-6 py-4 text-gray-700">{req.software_duration}</TableCell> {/* New column */}
                  <TableCell className="px-6 py-4 text-gray-700">{req.additional_info}</TableCell>
                  <TableCell className="px-6 py-4">
                    <Textarea
                      value={comments[req.requestId] || ''}
                      onChange={(e) => handleCommentChange(req.requestId, e.target.value)}
                      className="w-full"
                      rows={2}
                      placeholder="Enter comments (optional)"
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                        onClick={() => handleAction(req.requestId, 'Approved')}
                        disabled={actionLoading[req.requestId] || req.status !== 'Pending'}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => handleAction(req.requestId, 'Rejected')}
                        disabled={actionLoading[req.requestId] || req.status !== 'Pending'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {req.compliance_answered && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleViewAnswers(req.requestId)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && requests.length > 0 && (
        <PaginationControls
          className="mt-3"
          align="right"
          hideInfo={true}
          hidePageSize={true}
          currentPage={currentPage}
          totalPages={getTotalPages(requests.length)}
          pageSize={pageSize}
          totalItems={requests.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
        </TabsContent>

        <TabsContent value="create-request">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Software Request</h2>
              <p className="text-gray-600">Submit a new software request for yourself</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Software Name *</label>
                  <Input
                    name="software_name"
                    value={formData.software_name}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    placeholder="Enter software name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Software Version</label>
                  <Input
                    name="software_version"
                    value={formData.software_version}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter version (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">IT Admin *</label>
                  <Select
                    name="it_admin_id"
                    value={formData.it_admin_id}
                    onValueChange={(value) => handleSelectChange('it_admin_id', value)}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Unit</label>
                  <Select
                    name="business_unit_id"
                    value={formData.business_unit_id}
                    onValueChange={(value) => handleSelectChange('business_unit_id', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Business Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Software Duration</label>
                  <Select
                    name="software_duration"
                    value={formData.software_duration}
                    onValueChange={(value) => handleSelectChange('software_duration', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Continuous">Continuous</SelectItem>
                      <SelectItem value="1 month">1 Month</SelectItem>
                      <SelectItem value="3 months">3 Months</SelectItem>
                      <SelectItem value="6 months">6 Months</SelectItem>
                      <SelectItem value="1 year">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asset (Optional)</label>
                  <Select
                    name="asset_id"
                    value={formData.asset_id}
                    onValueChange={(value) => handleSelectChange('asset_id', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Asset Selected</SelectItem>
                      {managerAssets.map((asset) => (
                        <SelectItem key={asset.asset_id} value={asset.asset_id.toString()}>
                          {asset.asset_name} ({asset.asset_tag}) - {asset.asset_type}
                          {asset.brand && asset.model && ` - ${asset.brand} ${asset.model}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {managerAssets.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No assets allocated to you. Contact your manager to request asset allocation.
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Info</label>
                <Textarea
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  rows="4"
                  placeholder="Provide additional information about the software request"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({
                    software_name: '',
                    software_version: '',
                    additional_info: '',
                    it_admin_id: '',
                    business_unit_id: 'none',
                    software_duration: 'none',
                    asset_id: 'none',
                  })}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {formSubmitting ? 'Creating...' : 'Create Request'}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={answersDialogOpen} onOpenChange={setAnswersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compliance Answers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {complianceAnswers.length === 0 ? (
              <p className="text-gray-600">No answers submitted yet.</p>
            ) : (
              complianceAnswers.map((answer) => (
                <div key={answer.id} className="border-b pb-2">
                  <p className="font-medium text-gray-700">{answer.question_text}</p>
                  <p className="text-gray-600">Answer: {answer.answer}</p>
                  <p className="text-xs text-gray-500">Submitted on: {formatDate(answer.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoftwareRequestApproval;