import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Send, CheckCircle, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { leaveAPI } from '@/lib/api';
import ViewLeaveApplication from '@/components/HR/ViewLeaveApplication';
import { toast } from 'react-toastify';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
const ApplyLeave = () => {
  const formatStatus = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approve')) return 'Approved';
    if (s.includes('reject')) return 'Rejected';
    if (s.includes('pending')) return 'Pending';
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending';
  };

  const getStatusClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approve')) return 'bg-green-100 text-green-800 border-green-200';
    if (s.includes('reject')) return 'bg-red-100 text-red-800 border-red-200';
    if (s.includes('pending')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatLeaveType = (type) => {
    const t = String(type || '').toLowerCase();
    if (t === 'sick') return 'Sick';
    if (t === 'casual') return 'Casual';
    if (t === 'earned' || t === 'annual') return 'Annual';
    if (t === 'unpaid') return 'Unpaid';
    if (t === 'wfh') return 'WFH';
    if (t === 'maternity') return 'Maternity';
    if (t === 'paternity') return 'Paternity';
    return type || 'Leave';
  };

const getLeaveTypeColor = (leaveType) => {
    switch (leaveType) {
      case 'Annual Leave':
        return 'text-green-600';
      case 'Sick Leave':
        return 'text-orange-600';
      case 'Casual Leave':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLeaveTypeDot = (leaveType) => {
    switch (leaveType) {
      case 'Annual Leave':
        return 'bg-green-500';
      case 'Sick Leave':
        return 'bg-orange-500';
      case 'Casual Leave':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };
 

 
  const [activeTab, setActiveTab] = useState('apply'); // 'apply' | 'past'
  const [leaveData, setLeaveData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
    emergencyContact: '',
    handoverNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Leave balance status summary
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState(null);
  const [balances, setBalances] = useState({
    sick: { allocated: 0, available: 0, applied: 0 },
    casual: { allocated: 0, available: 0, applied: 0 },
    annual: { allocated: 0, available: 0, applied: 0 },
  });

  // Past leaves state
  const [allLeaves, setAllLeaves] = useState([]);
  const [pastLeavesLoading, setPastLeavesLoading] = useState(false);
  const [pastLeavesError, setPastLeavesError] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const leaveTypes = [
    'Annual Leave',
    'Sick Leave',
    'Casual Leave',
    'Maternity Leave',
    'Paternity Leave'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDays = () => {
    if (leaveData.startDate && leaveData.endDate) {
      const start = new Date(leaveData.startDate);
      const end = new Date(leaveData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (leaveData.halfDay && diffDays === 1) return 0.5;
      return diffDays;
    }
    return 0;
  };

  const { user } = useUser();

  // Fetch leave balances and compute applied totals
  useEffect(() => {
    const employeeId = user?.employeeId || JSON.parse(localStorage.getItem('user') || '{}')?.employeeId;
    if (!employeeId) return;

    const loadBalances = async () => {
      setBalancesLoading(true);
      setBalancesError(null);
      try {
        const [balanceRes, leavesRes] = await Promise.allSettled([
          leaveAPI.getLeaveBalance(employeeId),
          leaveAPI.getEmployeeLeaves(employeeId),
        ]);

        const bal = balanceRes.status === 'fulfilled' ? balanceRes.value : {};
        const leaves = leavesRes.status === 'fulfilled' ? leavesRes.value : [];
        setAllLeaves(leaves);

        const availableSick = bal?.sick_leaves ?? 0;
        const availableCasual = bal?.casual_leaves ?? 0;
        const availableAnnual = bal?.paid_leaves ?? 0;

        // Sum decisions by type: include only approved or rejected
        const totals = {
          sick: { approved: 0, rejected: 0 },
          casual: { approved: 0, rejected: 0 },
          annual: { approved: 0, rejected: 0 },
        };
        for (const lv of Array.isArray(leaves) ? leaves : []) {
          const type = (lv.leave_type || lv.leaveType || '').toLowerCase();
          const days = lv.no_of_days ?? lv.total_days ?? 0;
          const status = (lv.status || '').toLowerCase();
          const isApproved = status === 'approved';
          const isRejected = status === 'rejected';
          if (!(isApproved || isRejected)) continue; // ignore pending

          const assign = (bucket) => {
            if (type.includes('sick')) totals.sick[bucket] += days;
            else if (type.includes('casual')) totals.casual[bucket] += days;
            else if (type.includes('paid') || type.includes('annual')) totals.annual[bucket] += days;
          };
          assign(isApproved ? 'approved' : 'rejected');
        }

        setBalances({
          sick: {
            available: availableSick,
            applied: totals.sick.approved + totals.sick.rejected,
            // allocated reflects available + approved (exclude rejected)
            allocated: availableSick + totals.sick.approved,
          },
          casual: {
            available: availableCasual,
            applied: totals.casual.approved + totals.casual.rejected,
            allocated: availableCasual + totals.casual.approved,
          },
          annual: {
            available: availableAnnual,
            applied: totals.annual.approved + totals.annual.rejected,
            allocated: availableAnnual + totals.annual.approved,
          },
        });
      } catch (err) {
        console.error('Failed to load leave balances:', err);
        setBalancesError('Failed to load leave balances');
      } finally {
        setBalancesLoading(false);
      }
    };

    loadBalances();
  }, [user]);

  // Lazy load past leaves when tab opened if not present
  useEffect(() => {
    const employeeId = user?.employeeId || JSON.parse(localStorage.getItem('user') || '{}')?.employeeId;
    if (activeTab !== 'past' || !employeeId) return;
    if (allLeaves && allLeaves.length > 0) return;
    const loadPast = async () => {
      setPastLeavesLoading(true);
      setPastLeavesError(null);
      try {
        const data = await leaveAPI.getEmployeeLeaves(employeeId);
        setAllLeaves(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load past leaves:', err);
        setPastLeavesError('Failed to load past leaves');
      } finally {
        setPastLeavesLoading(false);
      }
    };
    loadPast();
  }, [activeTab, user]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const employeeId = user?.employeeId || JSON.parse(localStorage.getItem('user') || '{}')?.employeeId;
      if (!employeeId) {
        throw new Error('Missing employee ID. Please log in again.');
      }

      const response = await leaveAPI.applyLeave({
        employee_id: employeeId,
        leave_type: leaveData.leaveType,
        reason: leaveData.reason,
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        half_day: leaveData.halfDay,
      });

      const days = response?.totalDays ?? calculateDays();
      toast.success(`Leave application submitted successfully for ${days} day(s).`);
      
      // Reset form after success
      setTimeout(() => {
        setLeaveData({
          leaveType: '',
          startDate: '',
          endDate: '',
          reason: '',
          halfDay: false,
        });
        setMessage('');
      }, 3000);
    } catch (error) {
      toast.error('Failed to submit leave application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Leave balance status bars - placed outside the form card */}
      <div className="mb-6">
        {balancesLoading ? (
          <div className="text-sm text-muted-foreground">Loading leave balances...</div>
        ) : balancesError ? (
          <div className="text-sm text-red-600">{balancesError}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sick Leave */}
            <div className="bg-white rounded-lg p-4">
              <div className="mb-2 font-medium text-gray-800">Sick Leave</div>
              {(() => {
                const { allocated, available, applied } = balances.sick;
                const totalPct = allocated > 0 ? 100 : 0;
                const availPct = allocated > 0 ? Math.min(100, (available / allocated) * 100) : 0;
                const appliedPct = allocated > 0 ? Math.min(100, (applied / allocated) * 100) : 0;
                return (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Total Allocated</span>
                        <span>{allocated}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded">
                        <div className="h-2 rounded" style={{ width: `${totalPct}%`, backgroundColor: 'rgb(236, 241, 102)' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Available</span>
                        <span>{available}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded">
                          <div className="h-2 rounded" style={{ width: `${availPct}%`, backgroundColor: 'rgb(116, 209, 234)' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Applied</span>
                        <span>{applied}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded">
                          <div className="h-2 rounded" style={{ width: `${appliedPct}%`, backgroundColor: 'rgb(255, 114, 118)' }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Casual Leave */}
            <div className="bg-white rounded-lg p-4">
              <div className="mb-2 font-medium text-gray-800">Casual Leave</div>
              {(() => {
                const { allocated, available, applied } = balances.casual;
                const totalPct = allocated > 0 ? 100 : 0;
                const availPct = allocated > 0 ? Math.min(100, (available / allocated) * 100) : 0;
                const appliedPct = allocated > 0 ? Math.min(100, (applied / allocated) * 100) : 0;
                return (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Total Allocated</span>
                        <span>{allocated}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded">
                        <div className="h-2 rounded" style={{ width: `${totalPct}%`, backgroundColor: 'rgb(236, 241, 102)' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Available</span>
                        <span>{available}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded">
                          <div className="h-2 rounded" style={{ width: `${availPct}%`, backgroundColor: 'rgb(116, 209, 234)' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Applied</span>
                        <span>{applied}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded">
                          <div className="h-2 rounded" style={{ width: `${appliedPct}%`, backgroundColor: 'rgb(255, 114, 118)' }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Annual Leave */}
            <div className="bg-white rounded-lg p-4">
              <div className="mb-2 font-medium text-gray-800">Annual Leave</div>
              {(() => {
                const { allocated, available, applied } = balances.annual;
                const totalPct = allocated > 0 ? 100 : 0;
                const availPct = allocated > 0 ? Math.min(100, (available / allocated) * 100) : 0;
                const appliedPct = allocated > 0 ? Math.min(100, (applied / allocated) * 100) : 0;
                return (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Total Allocated</span>
                        <span>{allocated}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded">
                        <div className="h-2 rounded" style={{ width: `${totalPct}%`, backgroundColor: 'rgb(236, 241, 102)' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Available</span>
                        <span>{available}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded">
                          <div className="h-2 rounded" style={{ width: `${availPct}%`, backgroundColor: 'rgb(116, 209, 234)' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Applied</span>
                        <span>{applied}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded">
                          <div className="h-2 rounded" style={{ width: `${appliedPct}%`, backgroundColor: 'rgb(255, 114, 118)' }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
      <div className="bg-card rounded-lg shadow-sm border p-6 w-225">
        {/* Tabs header */}
        <div className="flex items-center gap-2 mb-6 border-b">
          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === 'apply' ? 'border-green-600 text-green-700' : 'border-transparent text-muted-foreground'
            }`}
          >
            Apply Leave
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === 'past' ? 'border-green-600 text-green-700' : 'border-transparent text-muted-foreground'
            }`}
          >
            Past Leaves
          </button>
        </div>

        {activeTab === 'apply' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">Apply for Leave</h2>
                <p className="text-sm text-muted-foreground">Submit your leave application</p>
              </div>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                message.includes('success') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.includes('success') && <CheckCircle className="h-4 w-4" />}
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-card-foreground">
                Leave Type *
              </label>
            </div>
            <select
              name="leaveType"
              value={leaveData.leaveType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={leaveData.startDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={leaveData.endDate}
                onChange={handleInputChange}
                min={leaveData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Reason for Leave *
            </label>
            <textarea
              name="reason"
              value={leaveData.reason}
              onChange={handleInputChange}
              placeholder="Please provide a detailed reason for your leave..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              required
            />
          </div>

          

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Leave Application'
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLeaveData({
                  leaveType: '',
                  startDate: '',
                  endDate: '',
                  reason: ''
                });
                setMessage('');
              }}
              className="px-6"
            >
              Reset
            </Button>
          </div>
        </form>
          </>
        )}

        {activeTab === 'past' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Past Leaves</h2>
                <p className="text-sm text-muted-foreground">Your previous leave applications</p>
              </div>
            </div>

            {pastLeavesLoading && (
              <div className="text-sm text-muted-foreground">Loading past leaves...</div>
            )}
            {pastLeavesError && (
              <div className="text-sm text-red-600 mb-3">{pastLeavesError}</div>
            )}
            {!pastLeavesLoading && !pastLeavesError && (
              <div className="overflow-x-auto">
                <Table className="border">
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead  className=" text-left" >Leave Type</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allLeaves.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                No leave records found.
              </TableCell>
            </TableRow>
          ) : (
            [...allLeaves]
              .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
              .map((lv) => (
                <TableRow key={lv.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getLeaveTypeDot(lv.leave_type)}`}></div>
                      <span className={`text-sm font-medium ${getLeaveTypeColor(lv.leave_type)}`}>
                        {formatLeaveType(lv.leave_type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(lv.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(lv.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(lv.status)}`}>
                      {formatStatus(lv.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      onClick={() => setSelectedLeave(lv)}
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                  </TableCell>
                </TableRow>
              ))
          )}
        </TableBody>
      </Table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View popup card */}
      <ViewLeaveApplication
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        leaveData={selectedLeave}
      />
    </div>
  );
};

export default ApplyLeave;