import React, { useEffect, useState } from 'react';
import { softwareRequestAPI } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Search, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';

const SoftwareRequest = () => {
  const [requests, setRequests] = useState([]);
  const [managers, setManagers] = useState([]);
  const [itAdmins, setItAdmins] = useState([]);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    software_name: '',
    software_version: '',
    additional_info: '',
    manager_id: 'none', // Use 'none' instead of empty string
    it_admin_id: '',
    business_unit_id: 'none', // Use 'none' instead of empty string
    software_duration: 'none', // Use 'none' instead of empty string
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage] = useState('10');
  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [complianceQuestions, setComplianceQuestions] = useState([]);
  const [complianceAnswers, setComplianceAnswers] = useState({});
  const [complianceSubmitting, setComplianceSubmitting] = useState(false);
  const [viewAnswersModalOpen, setViewAnswersModalOpen] = useState(false);
  const [viewAnswersData, setViewAnswersData] = useState([]);

  const currentUser = getCurrentUser();
  const employeeId = currentUser?.userId;

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
    id: index + 1,
    requestId: item.id,
    software_name: item.software_name,
    software_version: item.software_version || 'N/A',
    additional_info: item.additional_info || '',
    business_unit_name: item.business_unit_name || 'N/A',
    software_duration: item.software_duration || 'N/A',
    submitted_on: formatDate(item.created_at),
    status: mapStatus(item.status),
    compliance_answered: item.compliance_answered,
  });

  useEffect(() => {
    if (!employeeId) {
      toast.error('User not authenticated. Please log in.');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [managersData, adminsData, locationsData, requestsData] = await Promise.all([
          softwareRequestAPI.getEmployeeManagers(employeeId).catch((err) => {
            console.error('Failed to fetch managers:', err);
            return [];
          }),
          softwareRequestAPI.getItAdmins().catch((err) => {
            console.error('Failed to fetch IT admins:', err);
            return [];
          }),
          softwareRequestAPI.getLocations().catch((err) => {
            console.error('Failed to fetch locations:', err);
            return [];
          }),
          softwareRequestAPI.getSoftwareRequests().catch((err) => {
            console.error('Failed to fetch requests:', err);
            return [];
          }),
        ]);
        setManagers(managersData);
        setItAdmins(adminsData);
        setLocations(locationsData);
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

  useEffect(() => {
    if (selectedRequestId) {
      const fetchComplianceQuestions = async () => {
        try {
          const questionsData = await softwareRequestAPI.getAllComplianceQuestions();
          setComplianceQuestions(questionsData);
          setComplianceAnswers({});
        } catch (err) {
          console.error('Fetch compliance questions failed:', err);
          toast.error('Failed to fetch compliance questions.');
        }
      };
      fetchComplianceQuestions();
    }
  }, [selectedRequestId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleComplianceAnswerChange = (questionId, value) => {
    setComplianceAnswers((prev) => ({ ...prev, [questionId]: value }));
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
      // Map 'none' to null for optional fields
      const submitData = {
        ...formData,
        employee_id: employeeId,
        manager_id: formData.manager_id === 'none' ? null : parseInt(formData.manager_id),
        business_unit_id: formData.business_unit_id === 'none' ? null : parseInt(formData.business_unit_id),
        software_duration: formData.software_duration === 'none' ? null : formData.software_duration,
      };
      const response = await softwareRequestAPI.createSoftwareRequest(submitData);
      const newRequest = mapRequest(response, requests.length);
      setRequests([...requests, newRequest]);
      toast.success('Software request created successfully!');
      setFormData({
        software_name: '',
        software_version: '',
        additional_info: '',
        manager_id: 'none',
        it_admin_id: '',
        business_unit_id: 'none',
        software_duration: 'none',
      });
    } catch (err) {
      console.error('Create Software Request Error:', err.response || err);
      toast.error(err.response?.data?.detail || 'Failed to create software request.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleComplianceSubmit = async (requestId) => {
    if (complianceSubmitting) return;
    setComplianceSubmitting(true);

    const answerData = Object.entries(complianceAnswers).map(([questionId, answer]) => ({
      question_id: parseInt(questionId),
      answer,
    }));

    if (answerData.length !== complianceQuestions.length) {
      toast.error('Please answer all compliance questions.');
      setComplianceSubmitting(false);
      return;
    }

    try {
      await softwareRequestAPI.submitComplianceAnswers(requestId, answerData);
      toast.success('Compliance answers submitted successfully!');
      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === requestId ? { ...req, compliance_answered: true } : req
        )
      );
      setSelectedRequestId(null);
      setComplianceAnswers({});
    } catch (err) {
      console.error('Submit compliance answers error:', err);
      toast.error(err.response?.data?.detail || 'Failed to submit compliance answers.');
    } finally {
      setComplianceSubmitting(false);
    }
  };

  const handleViewAnswers = async (requestId) => {
    try {
      const answers = await softwareRequestAPI.getComplianceAnswers(requestId);
      setViewAnswersData(answers);
      setViewAnswersModalOpen(true);
    } catch (err) {
      console.error('Fetch compliance answers failed:', err);
      toast.error('Failed to fetch compliance answers.');
    }
  };

  const filteredRequests = requests.filter((request) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (request.software_name || '').toLowerCase().includes(q) ||
      (request.additional_info || '').toLowerCase().includes(q) ||
      (request.business_unit_name || '').toLowerCase().includes(q) ||
      (request.software_duration || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (request.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Reset pagination when filtered data changes
  useEffect(() => {
    resetPagination();
  }, [filteredRequests.length, searchTerm, statusFilter]);

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
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="new-request">New Request</TabsTrigger>
          {selectedRequestId && (
            <TabsTrigger value="compliance">Compliance Questions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="requests">
          <div className="flex items-center justify-between gap-4 mb-6">
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

          {!loading && filteredRequests.length > 0 && (
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
            ) : filteredRequests.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-600">No software requests found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</TableHead>
                    <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">SOFTWARE</TableHead>
                    <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">VERSION</TableHead>
                    <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">BUSINESS UNIT</TableHead>
                    <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">DURATION</TableHead>
                    <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">SUBMITTED ON</TableHead>
                    <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">STATUS</TableHead>
                    <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedData(filteredRequests).map((request, index) => (
                    <TableRow key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <TableCell className="text-center text-gray-600 px-6 py-4">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                      <TableCell className="px-6 py-4 text-gray-700">{request.software_name}</TableCell>
                      <TableCell className="px-6 py-4 text-gray-700">{request.software_version}</TableCell>
                      <TableCell className="px-6 py-4 text-gray-700">{request.business_unit_name}</TableCell>
                      <TableCell className="px-6 py-4 text-gray-700">{request.software_duration}</TableCell>
                      <TableCell className="px-6 py-4 text-gray-700">{request.submitted_on}</TableCell>
                      <TableCell className="px-6 py-4">{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="px-6 py-4 flex gap-2">
                        {!request.compliance_answered && request.status.toLowerCase() === 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 p-2 text-blue-600 hover:bg-blue-50"
                            onClick={() => setSelectedRequestId(request.requestId)}
                          >
                            Answer Compliance Questions
                          </Button>
                        )}
                        {request.compliance_answered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleViewAnswers(request.requestId)}
                            disabled={complianceSubmitting}
                            title="View compliance answers"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          {filteredRequests.length > 0 && (
            <PaginationControls
              className="mt-3"
              align="right"
              hideInfo={true}
              hidePageSize={true}
              currentPage={currentPage}
              totalPages={getTotalPages(filteredRequests.length)}
              pageSize={pageSize}
              totalItems={filteredRequests.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </TabsContent>

        <TabsContent value="new-request">
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
                <label className="block text-sm font-medium text-gray-700">Additional Info</label>
                <Textarea
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
                  onValueChange={(value) => handleSelectChange('manager_id', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Compliance Questions for{' '}
              {requests.find((req) => req.requestId === selectedRequestId)?.software_name || 'Selected Request'}
            </h2>
            {complianceQuestions.length === 0 ? (
              <div className="text-center text-gray-600">No compliance questions available.</div>
            ) : (
              <div className="space-y-4">
                {complianceQuestions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {question.question_text}
                    </label>
                    <Textarea
                      value={complianceAnswers[question.id] || ''}
                      onChange={(e) => handleComplianceAnswerChange(question.id, e.target.value)}
                      className="w-full"
                      rows={1}
                      placeholder="Enter your answer"
                      required
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleComplianceSubmit(selectedRequestId)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={complianceSubmitting}
                  >
                    {complianceSubmitting ? 'Submitting...' : 'Submit Answers'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRequestId(null)}
                    disabled={complianceSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={viewAnswersModalOpen} onOpenChange={setViewAnswersModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compliance Answers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {viewAnswersData.length === 0 ? (
              <div className="text-center text-gray-600">No answers available.</div>
            ) : (
              viewAnswersData.map((answer) => (
                <div key={answer.id} className="space-y-2 border-b border-gray-200 pb-4">
                  <p className="text-sm font-medium text-gray-700">{answer.question_text}</p>
                  <p className="text-sm text-gray-600">Answer: {answer.answer}</p>
                  <p className="text-xs text-gray-500">Submitted on: {formatDate(answer.created_at)}</p>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewAnswersModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoftwareRequest;