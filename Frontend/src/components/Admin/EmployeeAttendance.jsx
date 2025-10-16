import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Download, FileText, FileSpreadsheet, Eye, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AdminEmployeeAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetchAttendance();
  }, [selectedYear, selectedMonth]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/attendance/admin/all-attendance?year=${selectedYear}&month=${selectedMonth}`
      );
      setAttendanceData(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const monthName = months.find(m => m.value === selectedMonth)?.label;
    
    doc.setFontSize(18);
    doc.text(`Employee Attendance Report - ${monthName} ${selectedYear}`, 14, 20);
    
    const tableData = attendanceData.map(att => [
      att.name,
      att.email,
      att.role || 'N/A',
      att.type || 'N/A',
      new Date(att.date).toLocaleDateString(),
      att.day,
      att.status,
      att.hours.toFixed(2)
    ]);

    doc.autoTable({
      head: [['Employee', 'Email', 'Role', 'Type', 'Date', 'Day', 'Status', 'Hours']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`attendance_${monthName}_${selectedYear}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const downloadExcel = () => {
    const monthName = months.find(m => m.value === selectedMonth)?.label;
    
    const excelData = attendanceData.map(att => ({
      'Employee Name': att.name,
      'Email': att.email,
      'Role': att.role || 'N/A',
      'Type': att.type || 'N/A',
      'Date': new Date(att.date).toLocaleDateString(),
      'Day': att.day,
      'Status': att.status,
      'Hours': att.hours.toFixed(2),
      'Projects': att.projects.map(p => p.label).join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `attendance_${monthName}_${selectedYear}.xlsx`);
    toast.success('Excel downloaded successfully');
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const totalHours = useMemo(() => {
    return attendanceData.reduce((sum, att) => sum + att.hours, 0);
  }, [attendanceData]);

  const totalEmployees = useMemo(() => {
    return new Set(attendanceData.map(att => att.employee_id)).size;
  }, [attendanceData]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employee Attendance (Admin View)</h1>
                <p className="text-sm text-gray-600">View-only access to all employee attendance</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadPDF}
                disabled={loading || attendanceData.length === 0}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={downloadExcel}
                disabled={loading || attendanceData.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-md"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-md"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Employees</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{totalEmployees}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Total Records</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{attendanceData.length}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Total Hours</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{totalHours.toFixed(2)}</p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : attendanceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">No attendance records found</TableCell>
                  </TableRow>
                ) : (
                  attendanceData.map((item, idx) => (
                    <TableRow key={`${item.employee_id}-${item.date}-${idx}`}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.role || 'N/A'}</TableCell>
                      <TableCell>{item.type || 'N/A'}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell>{item.day}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>{item.hours.toFixed(2)}</TableCell>
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

export default AdminEmployeeAttendance;
