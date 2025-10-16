import React, { useEffect, useState } from 'react';
import { Calendar, Eye, Filter, FileText, FileSpreadsheet, Users } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AdminLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeaveRequests();
  }, [statusFilter]);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, searchTerm]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? '' : statusFilter;
      const response = await api.get(
        `/leave/admin/all-leave-requests${status ? `?status=${status}` : ''}`
      );
      setLeaveRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (!searchTerm) {
      setFilteredRequests(leaveRequests);
      return;
    }
    const filtered = leaveRequests.filter(req =>
      req.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employee_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.leave_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRequests(filtered);
  };

  const getStatusColor = (status) => {
    if (!status) return 'secondary';
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved') return 'default';
    if (statusLower === 'rejected') return 'destructive';
    if (statusLower === 'pending') return 'outline';
    return 'secondary';
  };

  const downloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.text('Leave Requests Report (Admin)', 14, 20);
    
    const tableData = filteredRequests.map(req => [
      req.employee_name,
      req.leave_type,
      new Date(req.start_date).toLocaleDateString(),
      new Date(req.end_date).toLocaleDateString(),
      req.manager_status,
      req.hr_status,
      req.reason || 'N/A'
    ]);

    doc.autoTable({
      head: [['Employee', 'Leave Type', 'Start Date', 'End Date', 'Manager Status', 'HR Status', 'Reason']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`leave_requests_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const downloadExcel = () => {
    const excelData = filteredRequests.map(req => ({
      'Employee Name': req.employee_name,
      'Email': req.employee_email,
      'Leave Type': req.leave_type,
      'Start Date': new Date(req.start_date).toLocaleDateString(),
      'End Date': new Date(req.end_date).toLocaleDateString(),
      'Manager Status': req.manager_status,
      'HR Status': req.hr_status,
      'Reason': req.reason || 'N/A',
      'Manager Remarks': req.manager_remarks || 'N/A',
      'HR Remarks': req.hr_remarks || 'N/A',
      'Created At': req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Requests');
    XLSX.writeFile(wb, `leave_requests_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel downloaded successfully');
  };

  const pendingCount = leaveRequests.filter(
    r => r.manager_status === 'Pending' || r.hr_status === 'Pending'
  ).length;
  
  const approvedCount = leaveRequests.filter(
    r => r.manager_status === 'Approved' && r.hr_status === 'Approved'
  ).length;
  
  const rejectedCount = leaveRequests.filter(
    r => r.manager_status === 'Rejected' || r.hr_status === 'Rejected'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Leave Requests (Admin View)</h1>
                <p className="text-sm text-gray-600">View-only access to all leave requests</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadPDF}
                disabled={loading || filteredRequests.length === 0}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={downloadExcel}
                disabled={loading || filteredRequests.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Requests</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{leaveRequests.length}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Approved</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">Rejected</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Input
              placeholder="Search by employee name, email, or leave type"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Manager Status</TableHead>
                  <TableHead>HR Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No leave requests found</TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.employee_name}</TableCell>
                      <TableCell>{item.leave_type}</TableCell>
                      <TableCell>{new Date(item.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(item.end_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.manager_status)}>
                          {item.manager_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.hr_status)}>
                          {item.hr_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.reason || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveRequests;
