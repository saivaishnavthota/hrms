import React, { useEffect, useState } from 'react';
import { softwareRequestAPI } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Search, CheckCircle, Clock, XCircle, Eye, Plus, Edit, Trash2, X } from 'lucide-react';
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
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [formData, setFormData] = useState({
    software_name: '',
    software_version: '',
    additional_info: '',
    manager_id: 'none', // Use 'none' instead of empty string
    it_admin_id: '',
    software_duration: 'none', // Use 'none' instead of empty string
    asset_id: '', // Made mandatory - removed 'none' default
  });
  
  // Store common fields that remain the same for all requests
  const [commonFields, setCommonFields] = useState({
    additional_info: '',
    manager_id: 'none',
    it_admin_id: '',
    software_duration: 'none',
    asset_id: '',
  });
  const [softwareRequests, setSoftwareRequests] = useState([]);
  const [currentSoftwareIndex, setCurrentSoftwareIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [complianceQuestions, setComplianceQuestions] = useState([]);
  const [complianceAnswers, setComplianceAnswers] = useState({});
  const [complianceSubmitting, setComplianceSubmitting] = useState(false);
  const [viewAnswersModalOpen, setViewAnswersModalOpen] = useState(false);
  const [viewAnswersData, setViewAnswersData] = useState([]);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);

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
        const [managersData, adminsData, locationsData, assetsData, requestsData] = await Promise.all([
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
          softwareRequestAPI.getEmployeeAssets(employeeId).catch((err) => {
            console.error('Failed to fetch employee assets:', err);
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
        setEmployeeAssets(assetsData);
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
    if (name === 'software_name' || name === 'software_version') {
      setFormData({ ...formData, [name]: value });
    } else {
      // Update common fields for other inputs
      setCommonFields({ ...commonFields, [name]: value });
    }
  };

  const handleSelectChange = (name, value) => {
    if (name === 'software_name' || name === 'software_version') {
      setFormData({ ...formData, [name]: value });
    } else {
      // Update common fields for other selects
      setCommonFields({ ...commonFields, [name]: value });
    }
  };

  // Add new software to the list
  const addSoftwareRequest = () => {
    if (!formData.software_name.trim()) {
      toast.error('Please enter software name');
      return;
    }
    if (!commonFields.asset_id) {
      toast.error('Please select an asset');
      return;
    }
    if (!commonFields.it_admin_id) {
      toast.error('Please select an IT admin');
      return;
    }

    const newSoftware = {
      id: Date.now(), // Temporary ID for UI
      software_name: formData.software_name,
      software_version: formData.software_version,
      additional_info: commonFields.additional_info,
      manager_id: commonFields.manager_id === 'none' ? null : parseInt(commonFields.manager_id),
      it_admin_id: parseInt(commonFields.it_admin_id),
      software_duration: commonFields.software_duration === 'none' ? null : commonFields.software_duration,
      asset_id: parseInt(commonFields.asset_id),
    };

    setSoftwareRequests([...softwareRequests, newSoftware]);
    
    // Reset only software name and version for next software
    setFormData({
      ...formData,
      software_name: '',
      software_version: '',
    });
    
    toast.success('Software added to request list');
  };

  // Remove software from the list
  const removeSoftwareRequest = (index) => {
    const updatedRequests = softwareRequests.filter((_, i) => i !== index);
    setSoftwareRequests(updatedRequests);
    if (currentSoftwareIndex >= updatedRequests.length) {
      setCurrentSoftwareIndex(Math.max(0, updatedRequests.length - 1));
    }
  };

  // Edit software in the list
  const editSoftwareRequest = (index) => {
    const software = softwareRequests[index];
    setFormData({
      software_name: software.software_name,
      software_version: software.software_version,
      additional_info: software.additional_info,
      manager_id: software.manager_id ? software.manager_id.toString() : 'none',
      it_admin_id: software.it_admin_id.toString(),
      software_duration: software.software_duration || 'none',
      asset_id: software.asset_id.toString(),
    });
    
    // Update common fields with the current software's values
    setCommonFields({
      additional_info: software.additional_info,
      manager_id: software.manager_id ? software.manager_id.toString() : 'none',
      it_admin_id: software.it_admin_id.toString(),
      software_duration: software.software_duration || 'none',
      asset_id: software.asset_id.toString(),
    });
    
    setCurrentSoftwareIndex(index);
  };

  // Update software in the list
  const updateSoftwareRequest = () => {
    if (!formData.software_name.trim()) {
      toast.error('Please enter software name');
      return;
    }
    if (!commonFields.asset_id) {
      toast.error('Please select an asset');
      return;
    }
    if (!commonFields.it_admin_id) {
      toast.error('Please select an IT admin');
      return;
    }

    const updatedSoftware = {
      id: softwareRequests[currentSoftwareIndex].id,
      software_name: formData.software_name,
      software_version: formData.software_version,
      additional_info: commonFields.additional_info,
      manager_id: commonFields.manager_id === 'none' ? null : parseInt(commonFields.manager_id),
      it_admin_id: parseInt(commonFields.it_admin_id),
      software_duration: commonFields.software_duration === 'none' ? null : commonFields.software_duration,
      asset_id: parseInt(commonFields.asset_id),
    };

    const updatedRequests = [...softwareRequests];
    updatedRequests[currentSoftwareIndex] = updatedSoftware;
    setSoftwareRequests(updatedRequests);

    // Reset only software name and version
    setFormData({
      ...formData,
      software_name: '',
      software_version: '',
    });
    setCurrentSoftwareIndex(0);
    
    toast.success('Software updated successfully');
  };

  // Clear all software requests
  const clearAllSoftwareRequests = () => {
    setSoftwareRequests([]);
    setCurrentSoftwareIndex(0);
    setFormData({
      software_name: '',
      software_version: '',
      additional_info: '',
      manager_id: 'none',
      it_admin_id: '',
      software_duration: 'none',
      asset_id: '',
    });
    setCommonFields({
      additional_info: '',
      manager_id: 'none',
      it_admin_id: '',
      software_duration: 'none',
      asset_id: '',
    });
  };

  const handleComplianceAnswerChange = (questionId, value) => {
    setComplianceAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Handle single software request submission
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    setFormSubmitting(true);

    if (!employeeId) {
      toast.error('User not authenticated. Please log in.');
      setFormSubmitting(false);
      return;
    }

    // Validate single software request
    if (!formData.software_name.trim()) {
      toast.error('Please enter software name');
      setFormSubmitting(false);
      return;
    }
    if (!commonFields.asset_id) {
      toast.error('Please select an asset');
      setFormSubmitting(false);
      return;
    }
    if (!commonFields.it_admin_id) {
      toast.error('Please select an IT admin');
      setFormSubmitting(false);
      return;
    }

    try {
      const submitData = {
        software_name: formData.software_name,
        software_version: formData.software_version,
        additional_info: commonFields.additional_info,
        manager_id: commonFields.manager_id === 'none' ? null : parseInt(commonFields.manager_id),
        it_admin_id: parseInt(commonFields.it_admin_id),
        software_duration: commonFields.software_duration === 'none' ? null : commonFields.software_duration,
        asset_id: parseInt(commonFields.asset_id),
        employee_id: employeeId,
      };

      console.log('Submitting single software request:', submitData);
      const response = await softwareRequestAPI.createSoftwareRequest(submitData);
      
      // Map response to the expected format and add to requests
      const newRequest = mapRequest(response, requests.length);
      setRequests([...requests, newRequest]);
      
      toast.success('Software request created successfully!');
      
      // Reset form
      setFormData({
        software_name: '',
        software_version: '',
        additional_info: '',
        manager_id: 'none',
        it_admin_id: '',
        software_duration: 'none',
        asset_id: '',
      });
      setCommonFields({
        additional_info: '',
        manager_id: 'none',
        it_admin_id: '',
        software_duration: 'none',
        asset_id: '',
      });
    } catch (err) {
      console.error('Create Software Request Error:', err.response || err);
      toast.error(err.response?.data?.detail || 'Failed to create software request.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle multiple software requests submission
  const handleMultipleSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    setFormSubmitting(true);

    if (!employeeId) {
      toast.error('User not authenticated. Please log in.');
      setFormSubmitting(false);
      return;
    }

    // Check if there's form data that hasn't been added to the list yet
    const hasFormData = formData.software_name.trim() && commonFields.asset_id && commonFields.it_admin_id;
    
    if (softwareRequests.length === 0 && !hasFormData) {
      toast.error('Please add at least one software request before submitting.');
      setFormSubmitting(false);
      return;
    }

    try {
      // Prepare all requests to submit
      let allRequestsToSubmit = [...softwareRequests];
      
      // If there's form data that hasn't been added to the list, include it
      if (hasFormData) {
        const formSoftware = {
          id: Date.now(), // Temporary ID for UI
          software_name: formData.software_name,
          software_version: formData.software_version,
          additional_info: commonFields.additional_info,
          manager_id: commonFields.manager_id === 'none' ? null : parseInt(commonFields.manager_id),
          it_admin_id: parseInt(commonFields.it_admin_id),
          software_duration: commonFields.software_duration === 'none' ? null : commonFields.software_duration,
          asset_id: parseInt(commonFields.asset_id),
        };
        allRequestsToSubmit.push(formSoftware);
      }

      console.log('Submitting software requests:', allRequestsToSubmit);
      console.log('Number of requests to submit:', allRequestsToSubmit.length);
      
      // Submit all software requests
      const submitPromises = allRequestsToSubmit.map((software, index) => {
        const submitData = {
          ...software,
          employee_id: employeeId,
        };
        console.log(`Submitting request ${index + 1}:`, submitData);
        return softwareRequestAPI.createSoftwareRequest(submitData);
      });

      console.log('Starting Promise.all with', submitPromises.length, 'promises');
      const responses = await Promise.allSettled(submitPromises);
      console.log('All requests submitted successfully:', responses);
      
      // Check for failures
      const successfulResponses = [];
      const failedResponses = [];
      
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResponses.push(result.value);
        } else {
          failedResponses.push({ index, error: result.reason });
          console.error(`Request ${index + 1} failed:`, result.reason);
        }
      });
      
      if (failedResponses.length > 0) {
        toast.error(`${failedResponses.length} request(s) failed. ${successfulResponses.length} request(s) submitted successfully.`);
      }
      
      if (successfulResponses.length > 0) {
        // Map successful responses to the expected format and add to requests
        const newRequests = successfulResponses.map((response, index) => 
          mapRequest(response, requests.length + index)
        );
        
        setRequests([...requests, ...newRequests]);
        
        if (failedResponses.length === 0) {
          toast.success(`${successfulResponses.length} software request(s) created successfully!`);
        }
        
        // Clear the software requests list and form
        clearAllSoftwareRequests();
      } else {
        toast.error('All requests failed. Please try again.');
      }
    } catch (err) {
      console.error('Create Software Request Error:', err.response || err);
      toast.error(err.response?.data?.detail || 'Failed to create software requests.');
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
      setComplianceModalOpen(false);
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
              <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
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
                      <TableCell className="px-6 py-4 text-gray-700">{request.software_duration}</TableCell>
                      <TableCell className="px-6 py-4 text-gray-700">{request.submitted_on}</TableCell>
                      <TableCell className="px-6 py-4">{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="px-6 py-4 flex gap-2">
                        {!request.compliance_answered && request.status.toLowerCase() === 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 p-2 text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedRequestId(request.requestId);
                              setComplianceModalOpen(true);
                            }}
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
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create New Software Request</h2>
                {softwareRequests.length === 0 ? (
                  <p className="text-sm text-gray-600 mt-1">
                    Fill out the form below and click "Submit Request" for a single software request, 
                    or click "Add Software" to add multiple software requests.
                  </p>
                ) : (
                  <p className="text-sm text-blue-600 mt-1">
                    Multiple software request mode: {softwareRequests.length} software(s) added. 
                    {(() => {
                      const hasFormData = formData.software_name.trim() && commonFields.asset_id && commonFields.it_admin_id;
                      const totalRequests = softwareRequests.length + (hasFormData ? 1 : 0);
                      return hasFormData 
                        ? ` Form data will be included automatically. Click "Submit ${totalRequests} Request(s)" to submit all requests.`
                        : ` Click "Submit ${totalRequests} Request(s)" to submit all requests.`;
                    })()}
                  </p>
                )}
              </div>
              {softwareRequests.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearAllSoftwareRequests}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                  <span className="text-sm text-gray-600 self-center">
                    {softwareRequests.length} software(s) added
                  </span>
                </div>
              )}
            </div>
            
            {/* Software Requests List */}
            {softwareRequests.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-3">Software Requests ({softwareRequests.length})</h3>
                <div className="space-y-2">
                  {softwareRequests.map((software, index) => {
                    const asset = employeeAssets.find(a => a.asset_id === software.asset_id);
                    const itAdmin = itAdmins.find(a => a.id === software.it_admin_id);
                    const manager = managers.find(m => m.id === software.manager_id);
                    
                    return (
                      <div key={software.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-gray-900">{software.software_name}</span>
                            {software.software_version && (
                              <span className="text-sm text-gray-600">v{software.software_version}</span>
                            )}
                            <span className="text-sm text-gray-500">
                              Asset: {asset ? `${asset.asset_name} (${asset.asset_tag})` : 'N/A'}
                            </span>
                            <span className="text-sm text-gray-500">
                              IT Admin: {itAdmin ? itAdmin.name : 'N/A'}
                            </span>
                          </div>
                          {software.additional_info && (
                            <p className="text-sm text-gray-600 mt-1">{software.additional_info}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSoftwareRequest(index)}
                            className="text-red-600 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={softwareRequests.length === 0 ? handleSingleSubmit : handleMultipleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700">Software Duration</label>
                <Select
                  name="software_duration"
                  value={commonFields.software_duration}
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
                <label className="block text-sm font-medium text-gray-700">
                  Asset <span className="text-red-500">*</span>
                </label>
                <Select
                  name="asset_id"
                  value={commonFields.asset_id}
                  onValueChange={(value) => handleSelectChange('asset_id', value)}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeAssets.map((asset) => (
                      <SelectItem key={asset.asset_id} value={asset.asset_id.toString()}>
                        {asset.asset_name} ({asset.asset_tag}) - {asset.asset_type}
                        {asset.brand && asset.model && ` - ${asset.brand} ${asset.model}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {employeeAssets.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    No assets allocated to you. Contact your manager to request asset allocation.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Info</label>
                <Textarea
                  name="additional_info"
                  value={commonFields.additional_info}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Manager</label>
                <Select
                  name="manager_id"
                  value={commonFields.manager_id}
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
                  value={commonFields.it_admin_id}
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
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={addSoftwareRequest}
                  className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Software
                </Button>
                
                {/* Show submit button for single request when no software in list */}
                {softwareRequests.length === 0 && (
                  <Button
                    type="button"
                    onClick={handleSingleSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                )}
                
                {/* Show submit button for multiple requests when software list has items */}
                {softwareRequests.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleMultipleSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Submitting...' : (() => {
                      const hasFormData = formData.software_name.trim() && commonFields.asset_id && commonFields.it_admin_id;
                      const totalRequests = softwareRequests.length + (hasFormData ? 1 : 0);
                      return `Submit ${totalRequests} Request(s)`;
                    })()}
                  </Button>
                )}
              </div>
            </form>
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

      <Dialog open={complianceModalOpen} onOpenChange={setComplianceModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Compliance Questions for{' '}
              {requests.find((req) => req.requestId === selectedRequestId)?.software_name || 'Selected Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => handleComplianceSubmit(selectedRequestId)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={complianceSubmitting}
            >
              {complianceSubmitting ? 'Submitting...' : 'Submit Answers'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setComplianceModalOpen(false);
                setSelectedRequestId(null);
                setComplianceAnswers({});
              }}
              disabled={complianceSubmitting}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoftwareRequest;