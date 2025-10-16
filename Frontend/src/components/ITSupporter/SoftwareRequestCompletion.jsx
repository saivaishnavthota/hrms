import React, { useState, useEffect } from 'react';
import { softwareRequestAPI } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Check, CheckCircle, Clock, Eye, Edit, Trash2, XCircle } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { avatarBg } from '../../lib/avatarColors';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Compliance Questions Management Component
const ComplianceQuestionsManagement = ({ isItAdmin, questions, setQuestions, questionsLoading, setQuestionsLoading }) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      toast.error('Question text cannot be empty.');
      return;
    }

    setQuestionsLoading(true);
    try {
      const response = await softwareRequestAPI.createComplianceQuestion({ question_text: newQuestion });
      setQuestions([...questions, response]);
      setNewQuestion('');
      toast.success('Question created successfully!');
    } catch (err) {
      console.error('Create question error:', err);
      toast.error(err.response?.data?.detail || 'Failed to create question.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleUpdateQuestion = async (questionId) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question.question_text.trim()) {
      toast.error('Question text cannot be empty.');
      return;
    }

    setQuestionsLoading(true);
    try {
      await softwareRequestAPI.updateComplianceQuestion(questionId, { question_text: question.question_text });
      setEditingQuestion(null);
      toast.success('Question updated successfully!');
    } catch (err) {
      console.error('Update question error:', err);
      toast.error(err.response?.data?.detail || 'Failed to update question.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    setQuestionsLoading(true);
    try {
      await softwareRequestAPI.deleteComplianceQuestion(questionId);
      setQuestions(questions.filter((q) => q.id !== questionId));
      toast.success('Question deleted successfully!');
    } catch (err) {
      console.error('Delete question error:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete question.');
    } finally {
      setQuestionsLoading(false);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const confirmDelete = (questionId) => {
    setQuestionToDelete(questionId);
    setDeleteDialogOpen(true);
  };

  const handleEditChange = (questionId, value) => {
    setQuestions(questions.map((q) => (q.id === questionId ? { ...q, question_text: value } : q)));
  };

  if (!isItAdmin) {
    console.log('ComplianceQuestionsManagement not rendered: isItAdmin is false');
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Compliance Question</h2>
        <form onSubmit={handleCreateQuestion} className="space-y-4">
          <Input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Enter new compliance question"
            className="mt-1"
          />
          <Button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={questionsLoading}
          >
            {questionsLoading ? 'Adding...' : 'Add Question'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {questionsLoading ? (
          <div className="px-6 py-10 text-center text-gray-600">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-600">No compliance questions available.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">QUESTION</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question, index) => (
                <TableRow key={question.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="text-center text-gray-600 px-6 py-4">{index + 1}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-700">
                    {editingQuestion === question.id ? (
                      <Input
                        value={question.question_text}
                        onChange={(e) => handleEditChange(question.id, e.target.value)}
                        className="w-full"
                      />
                    ) : (
                      question.question_text
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {editingQuestion === question.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                            onClick={() => handleUpdateQuestion(question.id)}
                            disabled={questionsLoading}
                            title="Save changes"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => setEditingQuestion(null)}
                            disabled={questionsLoading}
                            title="Cancel editing"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            onClick={() => setEditingQuestion(question.id)}
                            disabled={questionsLoading}
                            title="Edit question"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => confirmDelete(question.id)}
                            disabled={questionsLoading}
                            title="Delete question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">Are you sure you want to delete this compliance question? This action cannot be undone.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleDeleteQuestion(questionToDelete)}
              disabled={questionsLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Audit Reports Component
const AuditReports = ({ itAdminId, isSubmitting, setIsSubmitting }) => {
  const [reportType, setReportType] = useState('Monthly');
  const [year, setYear] = useState(new Date().getFullYear().toString()); // Initialize as string
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString()); // Initialize as string
  const [half, setHalf] = useState('First');

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

  const handleGenerateReport = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let start, end;
    const yy = year;

    if (reportType === 'Yearly') {
      start = `${yy}-01-01`;
      end = `${yy}-12-31`;
    } else if (reportType === 'Monthly') {
      const mm = month.padStart(2, '0');
      start = `${yy}-${mm}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      end = `${yy}-${mm}-${lastDay}`;
    } else if (reportType === 'Half-Yearly') {
      if (half === 'First') {
        start = `${yy}-01-01`;
        end = `${yy}-06-30`;
      } else {
        start = `${yy}-07-01`;
        end = `${yy}-12-31`;
      }
    }

    const startDate = new Date(`${start}T00:00:00Z`);
    const endDate = new Date(`${end}T23:59:59Z`);

    console.log('Date Range:', { start, end, startDate, endDate });

    try {
      const requestsData = await softwareRequestAPI.getSoftwareRequests(null);
      console.log('All requests data:', requestsData.length);

      const itAdminFiltered = requestsData.filter(
        (req) => req.it_admin_id === parseInt(itAdminId)
      );
      console.log('IT Admin filtered:', itAdminFiltered.length);

      const statusFiltered = itAdminFiltered.filter((req) => {
        const status = req.status?.toLowerCase();
        return status === 'approved' || status === 'completed';
      });
      console.log('Status filtered (approved/completed):', statusFiltered.length);

      const dateFiltered = statusFiltered.filter((req) => {
        const reqDate = new Date(req.created_at);
        const inRange = reqDate >= startDate && reqDate <= endDate;
        console.log(`Request ${req.id}: ${req.created_at} -> ${inRange}`);
        return inRange;
      });
      console.log('Date filtered:', dateFiltered.length);

      const complianceFiltered = dateFiltered.filter((req) => req.compliance_answered === true);
      console.log('Compliance filtered:', complianceFiltered.length);

      console.log('Final filtered requests for report:', complianceFiltered);

      if (complianceFiltered.length === 0) {
        toast.warning(
          `No requests found for the selected period.\n\n` +
          `Date Range: ${start} to ${end}\n` +
          `Total requests for IT Admin: ${itAdminFiltered.length}\n` +
          `Approved/Completed: ${statusFiltered.length}\n` +
          `In date range: ${dateFiltered.length}\n` +
          `With compliance answers: ${complianceFiltered.length}`
        );
        setIsSubmitting(false);
        return;
      }

      const withAnswers = await Promise.all(
        complianceFiltered.map(async (req) => {
          try {
            const answers = await softwareRequestAPI.getComplianceAnswers(req.id);
            return { ...req, compliance_answers: answers };
          } catch (err) {
            console.error(`Failed to get answers for request ${req.id}:`, err);
            return { ...req, compliance_answers: [] };
          }
        })
      );

      const finalRequests = withAnswers.filter(req => req.compliance_answers.length > 0);

      if (finalRequests.length === 0) {
        toast.error('No requests with compliance answers found for the selected period.');
        setIsSubmitting(false);
        return;
      }

      console.log('Final requests with answers:', finalRequests);

      const doc = new jsPDF('p', 'mm', 'a4');

      if (typeof doc.autoTable !== 'function') {
        console.error('jsPDF autoTable plugin is not loaded');
        toast.error('Failed to generate report: Table generation plugin is not available. Please check your setup.');
        setIsSubmitting(false);
        return;
      }

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(`${reportType} Audit Report - Software Compliance`, 14, 20);

      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`IT Admin: ${finalRequests[0]?.it_admin_name || 'N/A'}`, 14, 30);
      doc.text(`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 40);
      doc.text(`Total Requests in Report: ${finalRequests.length}`, 14, 50);

      let y = 70;

      finalRequests.forEach((req, idx) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text(`${idx + 1}. ${req.software_name} (${req.software_version || 'N/A'})`, 14, y);
        y += 8;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(`Employee: ${req.employee_name} (${req.employee_email})`, 14, y);
        y += 6;
        doc.text(`Manager: ${req.manager_name} (${req.manager_email})`, 14, y);
        y += 6;
        doc.text(`Business Unit: ${req.business_unit_name || 'N/A'}`, 14, y); // New field
        y += 6;
        doc.text(`Software Duration: ${req.software_duration || 'N/A'}`, 14, y); // New field
        y += 6;
        doc.text(`Status: ${req.status}`, 14, y);
        y += 6;
        doc.text(`Submitted: ${formatDate(req.created_at)}`, 14, y);
        y += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Compliance Answers:', 14, y);
        y += 8;

        doc.setFont(undefined, 'normal');
        const tableData = req.compliance_answers.map((ans) => [
          ans.question_text || `Question ${ans.question_id}`,
          ans.answer || 'N/A'
        ]);

        const estimatedHeight = (tableData.length + 1) * 6;
        if (y + estimatedHeight > 270) {
          doc.addPage();
          y = 20;
        }

        doc.autoTable({
          startY: y,
          head: [['Question', 'Answer']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [79, 70, 229],
            textColor: 255,
            fontSize: 9,
            halign: 'center'
          },
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 90 }
          },
          margin: { left: 14, right: 14 }
        });

        y = doc.lastAutoTable.finalY + 15;

        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y - 5, 195, y - 5);
        y += 5;
      });

      const currentDate = new Date().toLocaleDateString();
      doc.setFontSize(8);
      doc.text(`Report Generated: ${currentDate}`, 14, 280);
      doc.text(`Total Pages: ${doc.internal.getNumberOfPages()}`, 160, 280);

      doc.save(`compliance-audit-report-${yy}-${reportType.toLowerCase()}.pdf`);
      toast.success(`Audit report generated successfully! (${finalRequests.length} requests)`);

    } catch (err) {
      console.error('Generate report error:', err);
      toast.error(`Failed to generate audit report: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Generate Compliance Audit Report
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Generate PDF reports of software compliance answers for audit purposes
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly Report</SelectItem>
              <SelectItem value="Half-Yearly">Half-Yearly Report</SelectItem>
              <SelectItem value="Yearly">Yearly Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {reportType === 'Monthly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((monthName, idx) => (
                  <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {reportType === 'Half-Yearly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <Select value={half} onValueChange={setHalf}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="First">First Half (Jan - Jun)</SelectItem>
                <SelectItem value="Second">Second Half (Jul - Dec)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="pt-4">
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
            onClick={handleGenerateReport}
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting
              ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating PDF...
                </>
              )
              : 'Generate PDF Report'
            }
          </Button>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Selected Period:
          {reportType === 'Monthly' && (
            `${new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          )}
          {reportType === 'Half-Yearly' && (
            `${half} Half of ${year}`
          )}
          {reportType === 'Yearly' && (
            `${year}`
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-sm text-blue-900 mb-2">Report Contents:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Software details and request information</li>
          <li>• Employee and manager details</li>
          <li>• Business unit and software duration</li> {/* New field */}
          <li>• All compliance question answers</li>
          <li>• Date range filtering</li>
          <li>• Professional PDF format for audit purposes</li>
        </ul>
      </div>
    </div>
  );
};

// Main SoftwareRequestCompletion Component
const SoftwareRequestCompletion = () => {
  const [requests, setRequests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [complianceAnswers, setComplianceAnswers] = useState([]);
  const [viewAnswersModalOpen, setViewAnswersModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [activeTab, setActiveTab] = useState('requests');
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const currentUser = getCurrentUser();
  console.log('Current User:', currentUser);
  const itAdminId = currentUser?.userId;
  const isItAdmin = currentUser?.isItAdmin || (currentUser?.userType?.toLowerCase() === 'it admin');
  console.log('isItAdmin:', isItAdmin, 'userType:', currentUser?.userType);

  const getAvatarColor = (name) => avatarBg(name);

  const getInitials = (name) => {
    if (!name) return 'NA';
    const parts = name.trim().split(' ');
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase();
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

  const handleSelectRequest = (requestId) => {
    setSelectedRequests((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  useEffect(() => {
    console.log('useEffect triggered, activeTab:', activeTab, 'isItAdmin:', isItAdmin, 'statusFilter:', statusFilter);
    if (!itAdminId) {
      setError('User not authenticated. Please log in.');
      console.log('No itAdminId, user not authenticated');
      return;
    }

    const fetchData = async () => {
      try {
        const apiStatusFilter = statusFilter === 'all' ? null : statusFilter;
        console.log('Fetching requests with statusFilter:', apiStatusFilter);
        const requestsData = await softwareRequestAPI.getSoftwareRequests(apiStatusFilter);
        console.log('Software Requests:', requestsData);
        setRequests(
          requestsData
            .filter((req) => req.it_admin_id === parseInt(itAdminId))
            .map((req, index) => ({
              id: index + 1,
              requestId: req.id,
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
              business_unit_name: req.business_unit_name || 'N/A', // New field
              software_duration: req.software_duration || 'N/A', // New field
              status: req.status,
              compliance_answered: req.compliance_answered,
              created_at: req.created_at,
            }))
        );
        console.log('Filtered Requests:', requests);
      } catch (err) {
        console.error('Fetch requests error:', err);
        setError('Failed to fetch data. Please try again.');
      }
    };

    const fetchQuestions = async () => {
      setQuestionsLoading(true);
      try {
        const questionsData = await softwareRequestAPI.getAllComplianceQuestions();
        console.log('Compliance Questions:', questionsData);
        setQuestions(questionsData);
      } catch (err) {
        console.error('Fetch questions error:', err);
        toast.error('Failed to fetch compliance questions.');
      } finally {
        setQuestionsLoading(false);
      }
    };

    if (activeTab === 'requests') {
      fetchData();
    } else if (activeTab === 'compliance' && isItAdmin) {
      fetchQuestions();
    }
  }, [itAdminId, statusFilter, activeTab, isItAdmin]);

  const handleComplete = async (requestId) => {
    if (!itAdminId) {
      setError('User not authenticated. Please log in.');
      console.log('No itAdminId in handleComplete');
      return;
    }

    if (isSubmitting) {
      console.log('Action blocked: Submission in progress');
      return;
    }

    setIsSubmitting(true);
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    setError('');

    try {
      await softwareRequestAPI.completeSoftwareRequest(requestId);
      toast.success('Software request marked as Completed successfully!');
      setRequests((prev) => prev.filter((req) => req.requestId !== requestId));
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to complete software request.';
      console.error('Complete request error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
      setIsSubmitting(false);
    }
  };

  const handleSendComplianceEmails = async () => {
    if (selectedRequests.length === 0) {
      toast.error('Please select at least one request.');
      return;
    }

    if (isSubmitting) {
      console.log('Action blocked: Submission in progress');
      return;
    }

    setIsSubmitting(true);
    const requestsToSend = [...selectedRequests];
    setSelectedRequests([]);

    try {
      await softwareRequestAPI.sendComplianceEmails(requestsToSend);
      toast.success('Compliance emails sent successfully!');
    } catch (err) {
      console.error('Send compliance emails error:', err);
      toast.error(err.response?.data?.detail || 'Failed to send compliance emails.');
      setSelectedRequests(requestsToSend);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAnswers = async (requestId) => {
    if (isSubmitting) {
      console.log('Action blocked: Submission in progress');
      return;
    }

    setIsSubmitting(true);
    try {
      const answers = await softwareRequestAPI.getComplianceAnswers(requestId);
      console.log('Compliance Answers:', answers);
      setComplianceAnswers(answers);
      setSelectedRequestId(requestId);
      setViewAnswersModalOpen(true);
    } catch (err) {
      console.error('Fetch compliance answers error:', err);
      toast.error('Failed to fetch compliance answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Software Request Management</h1>
          <p className="text-gray-600 mt-1">View, complete software requests, and manage compliance questions</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                console.log('Switching to requests tab');
                setActiveTab('requests');
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Software Requests
            </button>
            <button
              onClick={() => {
                console.log('Switching to compliance tab, isItAdmin:', isItAdmin);
                setActiveTab('compliance');
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'compliance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Compliance Questions
            </button>
            <button
              onClick={() => {
                console.log('Switching to audit tab, isItAdmin:', isItAdmin);
                setActiveTab('audit');
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Audit Reports
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSendComplianceEmails}
                disabled={selectedRequests.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Sending...' : `Send Compliance Emails (${selectedRequests.length} selected)`}
              </Button>
            </div>
          </div>
          {error && <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{error}</div>}
          {requests.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-600">No software requests to display.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">
                    <Checkbox
                      checked={selectedRequests.length === requests.length && requests.length > 0}
                      onCheckedChange={() =>
                        setSelectedRequests(
                          selectedRequests.length === requests.length
                            ? []
                            : requests.map((req) => req.requestId)
                        )
                      }
                      disabled={isSubmitting}
                      title="Select all requests"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">EMPLOYEE</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">SOFTWARE</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">VERSION</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">BUSINESS UNIT</TableHead> {/* New column */}
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">DURATION</TableHead> {/* New column */}
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">ADDITIONAL INFO</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">MANAGER</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">MANAGER STATUS</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="text-center text-gray-600 px-6 py-4">
                      <Checkbox
                        checked={selectedRequests.includes(req.requestId)}
                        onCheckedChange={() => handleSelectRequest(req.requestId)}
                        disabled={isSubmitting}
                        title={`Select request for ${req.employee.name}`}
                      />
                    </TableCell>
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
                    <TableCell className="px-6 py-4 text-gray-700">{req.business_unit_name}</TableCell> {/* New column */}
                    <TableCell className="px-6 py-4 text-gray-700">{req.software_duration}</TableCell> {/* New column */}
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
                    <TableCell className="px-6 py-4">{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                          onClick={() => handleComplete(req.requestId)}
                          disabled={isSubmitting || actionLoading[req.requestId] || req.status !== 'Approved' || !req.compliance_answered}
                          title={req.status === 'Completed' ? 'Request already completed' : 'Complete request'}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        {req.compliance_answered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleViewAnswers(req.requestId)}
                            disabled={isSubmitting}
                            title="View compliance answers"
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
      )}

      {activeTab === 'compliance' && isItAdmin && (
        <ComplianceQuestionsManagement
          isItAdmin={isItAdmin}
          questions={questions}
          setQuestions={setQuestions}
          questionsLoading={questionsLoading}
          setQuestionsLoading={setQuestionsLoading}
        />
      )}

      {activeTab === 'audit' && isItAdmin && (
        <AuditReports
          itAdminId={itAdminId}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      )}

      {/* Modal for Viewing Compliance Answers */}
      <Dialog open={viewAnswersModalOpen} onOpenChange={setViewAnswersModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compliance Answers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {complianceAnswers.length === 0 ? (
              <div className="text-center text-gray-600">No answers available.</div>
            ) : (
              complianceAnswers.map((answer) => (
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

export default SoftwareRequestCompletion;