import React, { useState, useEffect } from 'react';
import { User, Eye, X, Search, CheckCircle, Home, CalendarDays, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { avatarBg } from '../../lib/avatarColors';
import api from "@/lib/api";
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';

const ManagerEmployeeAttendance = ({ viewOnly = false }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
    const [year, setYear] = useState(new Date().getFullYear()); // current year
    const [month, setMonth] = useState(new Date().getMonth() + 1); // current month (1-12)

  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

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

 

  // Fetch userId from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
    } else {
      setError('No user ID found in localStorage. Please log in.');
    }
  }, []);

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!userId) return;

      try {
        setError(null);
        const response = await api.get('/attendance/hr-daily', {
          params: { hr_id: userId, year, month }
        });
        setAttendanceRecords(transformData(response.data));
      } catch (error) {
        console.error('Error fetching attendance:', error);
        // setError(`Failed to fetch attendance records: ${error.message}. Please try again.`);
        setAttendanceRecords([]);
      }
    };

    const transformData = (data) => {
      return data.map((record, index) => {
        // Use employment_type directly from backend (Full-Time or Contract)
        const type = record.type || 'Full-Time'; // Default to 'Full-Time' if type is missing
        
        // Calculate total hours from subtasks (same as Manager component)
        const totalHours = (record.subTasks || []).reduce((sum, st) => sum + parseFloat(st.hours || 0), 0);
        
        // Transform projects with subtasks
        const projects = record.projects && record.projects.length > 0
          ? [...new Map(record.projects.map(p => [p.label, {
              name: p.label,
              total_hours: p.total_hours,
              subtasks: (record.subTasks || [])
                .filter(st => st.project === p.label)
                .map(st => ({
                  name: st.subTask,
                  hours: parseFloat(st.hours || 0)
                }))
            }])).values()]
          : [];

        return {
          id: index + 1,
          employee: { name: record.name || 'Unknown', email: record.email || 'N/A' },
          type: type,
          role: record.role || 'Employee', // Keep role as backend provides for roleFilter
          day: record.day || new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
          date: record.date || 'N/A',
          status: record.status || 'Unknown',
          hours: parseFloat(totalHours.toFixed(2)), // Use calculated hours from subtasks
          projects
        };
      });
    };

    fetchAttendance();
  }, [userId, year, month]);

  // Reset pagination when data changes
  useEffect(() => {
    resetPagination();
  }, [filteredRecords]);


  const handleShowProjects = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
  };

  const handleShowView = (record) => {
    setViewRecord(record);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewRecord(null);
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = (record.employee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.employee.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesRole = roleFilter === 'all' || record.role === roleFilter;
    return matchesSearch && matchesType && matchesRole;
  });

  // Helpers to compute counts
  const getCounts = (records) => {
    let present = 0, wfh = 0, leave = 0;
    for (const r of records) {
      if (r.status === 'Present') present += 1;
      else if (r.status === 'WFH') wfh += 1;
      else if (r.status === 'Leave') leave += 1;
    }
    return { present, wfh, leave };
  };

  const monthlyCounts = getCounts(filteredRecords);
  const latestDate = filteredRecords.reduce((max, r) => (r.date && (!max || r.date > max)) ? r.date : max, null);
  const dailyCounts = getCounts(filteredRecords.filter(r => r.date === latestDate));

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Present': 'bg-green-100 text-green-800',
      'WFH': 'bg-blue-100 text-blue-800',
      'Leave': 'bg-red-100 text-red-800',
      'Unknown': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // Download Attendance as PDF
  const downloadAttendanceAsPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      
      // Header
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Employee Attendance Report', 14, 15);
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Period: ${getMonthName(month)} ${year}`, 14, 23);
      doc.text(`Total Records: ${filteredRecords.length}`, 14, 29);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 35);
      
      // Summary statistics
      doc.setFontSize(10);
      doc.text(`Present: ${monthlyCounts.present} | WFH: ${monthlyCounts.wfh} | Leave: ${monthlyCounts.leave}`, 14, 41);
      
      // Table data
      const tableData = filteredRecords.map(record => [
        record.employee.name,
        record.employee.email,
        record.type,
        record.role,
        record.day,
        record.date,
        record.status,
        `${record.hours}h`,
        record.projects.length > 0 ? record.projects.map(p => p.name).join(', ') : 'No projects'
      ]);
      
      doc.autoTable({
        startY: 47,
        head: [['Employee', 'Email', 'Type', 'Role', 'Day', 'Date', 'Status', 'Hours', 'Projects']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 20 },
          7: { cellWidth: 15 },
          8: { cellWidth: 'auto' }
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { left: 14, right: 14 }
      });
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
      }
      
      doc.save(`Attendance_Report_${month}_${year}.pdf`);
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report.');
    }
  };

  // Download Attendance as Excel
  const downloadAttendanceAsExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredRecords.map(record => ({
        'Employee Name': record.employee.name,
        'Email': record.employee.email,
        'Type': record.type,
        'Role': record.role,
        'Day': record.day,
        'Date': record.date,
        'Status': record.status,
        'Hours': record.hours,
        'Projects': record.projects.length > 0 ? record.projects.map(p => p.name).join(', ') : 'No projects',
        'Subtasks': record.projects.length > 0 
          ? record.projects.map(p => p.subtasks.map(st => `${st.name} (${st.hours}h)`).join('; ')).join(' | ')
          : 'None'
      }));
      
      // Create summary data
      const summaryData = [
        { 'Summary': 'Period', 'Value': `${getMonthName(month)} ${year}` },
        { 'Summary': 'Total Records', 'Value': filteredRecords.length },
        { 'Summary': 'Present', 'Value': monthlyCounts.present },
        { 'Summary': 'WFH', 'Value': monthlyCounts.wfh },
        { 'Summary': 'Leave', 'Value': monthlyCounts.leave },
        { 'Summary': 'Generated Date', 'Value': new Date().toLocaleDateString() }
      ];
      
      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      
      // Add summary sheet
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      
      // Add attendance data sheet
      const wsData = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
        { wch: 25 }, // Employee Name
        { wch: 30 }, // Email
        { wch: 12 }, // Type
        { wch: 12 }, // Role
        { wch: 12 }, // Day
        { wch: 12 }, // Date
        { wch: 10 }, // Status
        { wch: 8 },  // Hours
        { wch: 40 }, // Projects
        { wch: 50 }  // Subtasks
      ];
      wsData['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, wsData, 'Attendance Data');
      
      // Write file
      XLSX.writeFile(wb, `Attendance_Report_${month}_${year}.xlsx`);
      toast.success('Excel report downloaded successfully!');
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.error('Failed to generate Excel report.');
    }
  };

  // Helper function to get month name
  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthNum) - 1] || 'Unknown';
  };

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Employee Attendance
            {viewOnly && <span className="ml-3 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">View Only</span>}
          </h1>
          <p className="text-gray-600 mt-2">
            {viewOnly ? 'View all attendance records (read-only access)' : 'View and manage employee attendance records'}
          </p>
        </div>
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm w-24"
            />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadAttendanceAsPDF}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm"
              disabled={filteredRecords.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Download PDF
            </button>
            <button
              onClick={downloadAttendanceAsExcel}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
              disabled={filteredRecords.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Excel
            </button>
          </div>
        </div>
        {/* Summary counts below filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Monthly Summary */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-semibold text-gray-800">Monthly Summary</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-3">
                <div className="text-xs font-medium text-green-800 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Present
                </div>
                <div className="mt-1 text-2xl font-bold text-green-900">{monthlyCounts.present}</div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3">
                <div className="text-xs font-medium text-blue-800 flex items-center gap-1">
                  <Home className="h-3 w-3" /> WFH
                </div>
                <div className="mt-1 text-2xl font-bold text-blue-900">{monthlyCounts.wfh}</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-3">
                <div className="text-xs font-medium text-red-800 flex items-center gap-1">
                  <X className="h-3 w-3" /> Leave
                </div>
                <div className="mt-1 text-2xl font-bold text-red-900">{monthlyCounts.leave}</div>
              </div>
            </div>
          </div>

          {/* Daily Summary (latest date with data) */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-semibold text-gray-800">Daily Summary{latestDate ? ` — ${latestDate}` : ''}</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-3">
                <div className="text-xs font-medium text-green-800 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Present
                </div>
                <div className="mt-1 text-2xl font-bold text-green-900">{dailyCounts.present}</div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3">
                <div className="text-xs font-medium text-blue-800 flex items-center gap-1">
                  <Home className="h-3 w-3" /> WFH
                </div>
                <div className="mt-1 text-2xl font-bold text-blue-900">{dailyCounts.wfh}</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-3">
                <div className="text-xs font-medium text-red-800 flex items-center gap-1">
                  <X className="h-3 w-3" /> Leave
                </div>
                <div className="mt-1 text-2xl font-bold text-red-900">{dailyCounts.leave}</div>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Employee Attendance Records</h2>
                <p className="text-sm text-gray-600 mt-1">View and manage attendance records</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm w-64"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Contract">Contract</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
            </div>
          </div>
          {filteredRecords.length > 0 && (
            <div className="flex justify-end mb-2 px-6">
              <PageSizeSelect
                pageSize={pageSize}
                onChange={handlePageSizeChange}
                options={[10, 20, 30, 40, 50]}
              />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects-Subtasks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedData(filteredRecords).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                         
 <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAvatarColor(record.employee.name)} flex items-center justify-center`}>
                        <span className="text-sm font-medium text-white">
                          {record.employee.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.employee.name}</div>
                          <div className="text-sm text-gray-500">{record.employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.day}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200">
                        {record.hours}h
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {record.projects && record.projects.length > 0 ? (
                          <button
                            onClick={() => handleShowProjects(record)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Projects ({record.projects.length})
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">No projects</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleShowView(record)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRecords.length === 0 && (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {attendanceRecords.length === 0 ? 'No attendance records' : 'No matching records found'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {attendanceRecords.length === 0 ? 'No attendance records found.' : 'Try adjusting your search or filters.'}
                </p>
              </div>
            )}
          </div>
          {filteredRecords.length > 0 && (
            <div className="px-6 pb-4">
              <PaginationControls
                className="mt-3"
                align="right"
                hideInfo={true}
                hidePageSize={true}
                currentPage={currentPage}
                totalPages={getTotalPages(filteredRecords.length)}
                pageSize={pageSize}
                totalItems={filteredRecords.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </div>
      </div>
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
              <div>
                <h3 className="text-lg font-semibold text-white">Projects & Subtasks</h3>
                <p className="text-sm text-blue-100 mt-1">{selectedRecord.employee.name} - {selectedRecord.date}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-blue-100 hover:text-white p-1 rounded-full hover:bg-blue-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {selectedRecord.projects && selectedRecord.projects.length > 0 ? (
                <div className="space-y-6">
                  {selectedRecord.projects.map((project, projectIndex) => (
                    <div key={projectIndex} className="bg-white/70 backdrop-blur-sm border border-blue-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-2"></div>
                        {project.name}
                      </h4>
                      {project.subtasks && project.subtasks.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">Subtasks:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {project.subtasks.map((subtask, subtaskIndex) => (
        <div
          key={subtaskIndex}
          className="flex items-center justify-between p-2 bg-white/50 rounded-md border border-blue-100"
        >
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mr-3"></div>
            <span className="text-sm text-gray-800">{subtask.name}</span>
          </div>
          <span className="text-xs font-semibold text-gray-600">{subtask.hours}h</span>
        </div>
      ))}
    </div>
  </div>
) : (

                        <p className="text-sm text-gray-500 italic">No subtasks for this project</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-gray-600 font-medium">No projects assigned</p>
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showViewModal && viewRecord && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white">Employee Details - {viewRecord.employee.name}</h3>
              <button
                onClick={handleCloseViewModal}
                className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-2"></div>
                    Employee Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-gray-800">{viewRecord.employee.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="text-gray-800">{viewRecord.employee.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Type:</span>
                      <p className="text-gray-800">{viewRecord.type}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Role:</span>
                      <p className="text-gray-800">{viewRecord.role}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mr-2"></div>
                    Attendance Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Day:</span>
                      <p className="text-gray-800">{viewRecord.day}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Date:</span>
                      <p className="text-gray-800">{viewRecord.date}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <div className="mt-1">{getStatusBadge(viewRecord.status)}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Hours:</span>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200">
                          {viewRecord.hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-md">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-2"></div>
                    Projects & Subtasks
                  </h4>
                  {viewRecord.projects && viewRecord.projects.length > 0 ? (
                    <div className="space-y-4">
                      {viewRecord.projects.map((project, index) => (
                        <div key={index} className="bg-white/50 border border-gray-100 rounded-lg p-3">
                          <h5 className="font-medium text-gray-800 mb-2">{project.name}</h5>
                          <div className="space-y-1">
                            {project.subtasks.map((subtask, subIndex) => (
    <div key={subIndex} className="flex items-center justify-between space-x-2">
      <div className="flex items-center space-x-2">
        <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
        <span className="text-sm text-gray-700">{subtask.name}</span>
      </div>
      <span className="text-xs font-semibold text-gray-600">{subtask.hours}h</span>
    </div>
  ))}
</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600">No projects assigned</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={handleCloseViewModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerEmployeeAttendance;