





import React, { useState, useEffect } from 'react';
import api, { weekoffAPI } from '@/lib/api';
import { Calendar, Clock, Plus, X, Save, ChevronLeft, ChevronRight, Edit3, Search, Filter, Eye, Briefcase } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';

// Local date helpers to avoid UTC offsets
const formatDateLocal = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateLocal = (dateStr) => {
  if (!dateStr) return new Date(NaN);
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const AddAttendance = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('add');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [submittedAttendance, setSubmittedAttendance] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [weekOffDays, setWeekOffDays] = useState([]);
  const [allWeekOffs, setAllWeekOffs] = useState([]);
  const [defaultWeekoffs, setDefaultWeekoffs] = useState([]);
  const [hasDefaultWeekoffs, setHasDefaultWeekoffs] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchDate, setSearchDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filteredDailyAttendance, setFilteredDailyAttendance] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Pagination for daily attendance
  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    getPaginatedData,
    getTotalPages,
    resetPagination,
  } = usePagination(10);

  const getWeekDates = (date) => {
    const week = [];
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const isWeekOffForDate = (date) => {
    if (!allWeekOffs || allWeekOffs.length === 0) {
      return false;
    }
    
    const weekDates = getWeekDates(date);
    const weekStart = formatDateLocal(weekDates[0]);
    const weekEnd = formatDateLocal(weekDates[6]);
    
    // Find weekoff record for this week
    const weekOff = allWeekOffs.find(wo => 
      wo.week_start === weekStart && wo.week_end === weekEnd
    );
    
    if (weekOff && weekOff.off_days && Array.isArray(weekOff.off_days)) {
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      return weekOff.off_days.includes(dayOfWeek);
    }
    
    // If no specific weekoff found, check if it's a default weekend (Saturday/Sunday)
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    return dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
  };

  useEffect(() => {
    const weekDates = getWeekDates(currentWeek);
    const initialData = {};

    weekDates.forEach((date, index) => {
      const dateStr = formatDateLocal(date);
      initialData[index] = {
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        status: '',
        hours: 0,
        projects: [],
        submitted: false
      };
    });

    setAttendanceData(initialData);
    fetchWeeklyAttendance();
  }, [currentWeek, user]);

  useEffect(() => {
    if (user?.employeeId) {
      fetchProjects();
      fetchDailyAttendance();
      fetchWeekOffs();
      fetchDefaultWeekoffs();
    } else if (user) {
      // If user exists but no employeeId, logout
      toast.error('Employee ID not found. Logging out...');
      // Assume UserContext has a logout function; if not, navigate to login
      navigate('/login'); // Or call logout from context if available
    }
  }, [user, navigate]);

  useEffect(() => {
    if (allWeekOffs.length > 0) {
      const weekDates = getWeekDates(currentWeek);
      const weekStart = formatDateLocal(weekDates[0]);
      const weekEnd = formatDateLocal(weekDates[6]);
      const currentWeekOff = allWeekOffs.find(
        (wo) => wo.week_start === weekStart && wo.week_end === weekEnd
      );
      setWeekOffDays(currentWeekOff ? currentWeekOff.off_days || [] : []);
    }
  }, [currentWeek, allWeekOffs]);

  useEffect(() => {
    filterDailyAttendance();
    resetPagination();
  }, [dailyAttendance, selectedMonth, selectedYear, searchDate, typeFilter]);

  useEffect(() => {
    if (activeTab === 'calendar' && user?.employeeId) {
      fetchDailyAttendance();
    }
  }, [activeTab, selectedMonth, selectedYear, user]);

  const fetchWeekOffs = async () => {
    try {
      if (!user?.employeeId) {
        return;
      }

      const response = await api.get(`/weekoffs/${user.employeeId}`);
      console.log('Weekoffs fetched:', response.data); // Debug log
      setAllWeekOffs(response.data || []);
    } catch (error) {
      console.error('Error fetching week-offs:', error);
      const errorMessage = error.response?.data?.detail || 'Error fetching week-offs';
      setMessage(errorMessage);
      toast.error(errorMessage);
      setTimeout(() => setMessage(''), 5000);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Logging out...');
        navigate('/login');
      }
    }
  };

  const fetchDefaultWeekoffs = async () => {
    try {
      if (!user?.employeeId) {
        return;
      }

      const response = await weekoffAPI.getDefaultWeekoffs(user.employeeId);
      setDefaultWeekoffs(response.default_off_days || []);
      setHasDefaultWeekoffs(true);
    } catch (error) {
      console.error('Error fetching default weekoffs:', error);
      // Set default weekoffs as Saturday and Sunday if API fails
      setDefaultWeekoffs(['Saturday', 'Sunday']);
      setHasDefaultWeekoffs(true);
    }
  };

  const setDefaultWeekoffsForEmployee = async () => {
    try {
      if (!user?.employeeId) {
        toast.warn('Employee ID not found');
        return;
      }

      setLoading(true);
      await weekoffAPI.setDefaultWeekoffs(user.employeeId);
      toast.success('Default weekoffs set successfully');
      await fetchWeekOffs(); // Refresh the weekoffs
    } catch (error) {
      console.error('Error setting default weekoffs:', error);
      const errorMessage = error.response?.data?.detail || 'Error setting default weekoffs';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterDailyAttendance = () => {
    let filtered = [...dailyAttendance];

    filtered = filtered.filter(record => {
      const recordDate = parseDateLocal(record.date);
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
    });

    if (searchDate) {
      filtered = filtered.filter(record => record.date === searchDate);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.type === typeFilter);
    }

    filtered.sort((a, b) => parseDateLocal(b.date) - parseDateLocal(a.date));
    setFilteredDailyAttendance(filtered);
  };

  const fetchDailyAttendance = async () => {
    try {
      if (!user?.employeeId) return;

      setLoading(true);

      const year = selectedYear || new Date().getFullYear();
      const month = (selectedMonth !== undefined ? selectedMonth : new Date().getMonth()) + 1;

      const response = await api.get('/attendance/daily', {
        params: {
          employee_id: user.employeeId,
          year: year,
          month: month
        }
      });

      console.log('Daily Attendance Response:', response.data); // Debugging

      if (response.data && response.data.length > 0) {
        const formattedData = response.data.map(record => ({
          date: record.date,
          status: record.status || record.action || 'Not set',
          hours: record.hours || 0,
          type: record.type || 'Full-Time',
          projects: (record.projects || []).map(p => ({
            projectId: String(p.value),
            projectName: p.label,
            subtasks: (record.subTasks || [])
              .filter(st => st.project === p.label)
              .flatMap(st => (st.subTasks || []).map(sub => ({ name: sub.sub_task, hours: sub.hours })))
          }))
        }));
        setDailyAttendance(formattedData);
        setSubmittedAttendance(formattedData);
      } else {
        setDailyAttendance([]);
        setSubmittedAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching daily attendance:', error);
      const errorMessage = error.response?.data?.detail || 'Error fetching daily attendance data';
      setMessage(errorMessage);
      toast.error(errorMessage);
      setTimeout(() => setMessage(''), 5000);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Logging out...');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowProjects = (record) => {
    setSelectedRecord(record);
    setShowProjectModal(true);
  };

  const handleCloseProjectModal = () => {
    setShowProjectModal(false);
    setSelectedRecord(null);
  };

  const fetchProjects = async () => {
    try {
      if (!user?.employeeId) {
        return;
      }

      const response = await api.get('/attendance/active-projects', {
        params: { employee_id: user.employeeId }
      });
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      const errorMessage = error.response?.data?.detail || 'Error fetching assigned projects';
      setMessage(errorMessage);
      toast.error(errorMessage);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Logging out...');
        navigate('/login');
      }
    }
  };
  const fetchWeeklyAttendance = async () => {
    try {
      if (!user?.employeeId) return;
   
   
      setLoading(true);
      const weekDates = getWeekDates(currentWeek);
      const weekStart = formatDateLocal(weekDates[0]);
      const weekEnd = formatDateLocal(weekDates[6]);
   
     
   
      const baseData = {};
      weekDates.forEach((date, index) => {
        const dateStr = formatDateLocal(date);
        baseData[index] = {
          date: dateStr,
          day: date.toLocaleDateString('en-US', { weekday: 'long' }),
          status: '',
          hours: 0.0,
          projects: [],
          submitted: false
        };
      });
   
   
      const response = await api.get('/attendance/weekly', {
        params: {
          employee_id: user.employeeId,
          week_start: weekStart, // Pass week_start
          week_end: weekEnd      // Pass week_end
        }
       
      });
   
   
      console.log('Weekly Attendance Response:', response.data);
   
   
      if (response.data) {
        const updatedData = { ...baseData };
        Object.keys(response.data).forEach(dateStr => {
          const attendance = response.data[dateStr];
          const rowIndex = Object.keys(updatedData).find(key =>
            updatedData[key].date === dateStr
          );
   
   
          if (rowIndex !== undefined) {
            const projects = (attendance.projects || []).map(p => ({
              projectId: String(p.value),
              projectName: p.label,
              subtasks: (attendance.subTasks || [])
                .filter(st => st.project === p.label)
                .flatMap(st => (st.subTasks || []).map(sub => ({
                  name: sub.sub_task,
                  hours: parseFloat(sub.hours || 0)
                 
                })))
            }));
   
   
            const totalHours = projects.reduce((sum, project) =>
              sum + (project.subtasks || []).reduce((subSum, subtask) => subSum + parseFloat(subtask.hours || 0), 0), 0);
   
   
            updatedData[rowIndex] = {
              ...updatedData[rowIndex],
              status: attendance.action || attendance.status,
              hours: parseFloat(totalHours.toFixed(2)),
              projects: projects,
              submitted: !!attendance.action
            };
          }
        });
        setAttendanceData(updatedData);
      } else {
        setAttendanceData(baseData);
      }
    } catch (error) {
      console.error('Error fetching weekly attendance:', error);
      const errorMessage = error.response?.data?.detail || 'Error fetching attendance data';
      setMessage(errorMessage);
      toast.error(errorMessage);
      setTimeout(() => setMessage(''), 5000);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Logging out...');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleStatusChange = (index, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        status,
        hours: status === 'Leave' ? 0 : prev[index].hours
      }
    }));
  };

  const openProjectPopup = (index) => {
    setSelectedRowIndex(index);
    setShowProjectPopup(true);
  };

  const handleProjectSelect = (selectedProjects) => {
    if (selectedRowIndex !== null) {
      // Calculate total hours from subtasks
      const totalHours = selectedProjects.reduce((sum, project) =>
        sum + (project.subtasks || []).reduce((subSum, subtask) => subSum + (subtask.hours || 0), 0), 0);
      

      setAttendanceData(prev => ({
        ...prev,
        [selectedRowIndex]: {
          ...prev[selectedRowIndex],
          projects: selectedProjects,
          hours: totalHours
         
        }
      }));
    }
    setShowProjectPopup(false);
    setSelectedRowIndex(null);
  };

  const removeProject = (rowIndex, projectIndex) => {
    setAttendanceData(prev => {
      const updatedProjects = prev[rowIndex].projects.filter((_, i) => i !== projectIndex);
      const totalHours = updatedProjects.reduce((sum, project) =>
        sum + (project.subtasks || []).reduce((subSum, subtask) => subSum + (subtask.hours || 0), 0), 0);
       

      return {
        ...prev,
        [rowIndex]: {
          ...prev[rowIndex],
          projects: updatedProjects,
          hours: totalHours
         
        }
      };
    });
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const toggleWeekOff = (day) => {
    setWeekOffDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      }
      if (prev.length >= 2) {
        toast.info('You can select up to 2 week-off days');
        setTimeout(() => setMessage(''), 2500);
        return prev;
      }
      return [...prev, day];
    });
  };

  const submitWeekOffs = async () => {
    try {
      if (!user?.employeeId) {
        toast.warn('Employee ID not found');
        setTimeout(() => setMessage(''), 5000);
        return;
      }

      const weekDates = getWeekDates(currentWeek);
      const week_start = formatDateLocal(weekDates[0]);
      const week_end = formatDateLocal(weekDates[6]);

      const payload = {
        employee_id: user.employeeId,
        week_start,
        week_end,
        off_days: weekOffDays
      };

      setLoading(true);
      const response = await api.post('/weekoffs', payload);
      toast.success('Week-off saved successfully');
      setTimeout(() => setMessage(''), 3000);
      await fetchWeekOffs();
    } catch (error) {
      console.error('Error saving week-offs:', error);
      const errorMessage = error.response?.data?.detail || 'Error saving week-offs';
      toast.error(errorMessage);
      setTimeout(() => setMessage(''), 5000);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Logging out...');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitAttendance = async () => {
    try {
      if (!user?.employeeId) {
        toast.warn('Employee ID not found');
        return;
      }

      // Validate week-offs
      const weekOffViolations = Object.values(attendanceData).filter(row => {
        const dayOfWeek = row.day;
        return weekOffDays.includes(dayOfWeek) && (
          row.status || row.hours > 0 || row.projects.length > 0
        );
      });

      if (weekOffViolations.length > 0) {
        const violationDays = weekOffViolations.map(row => row.day).join(', ');
        toast.warn(`Cannot submit attendance for week-off days: ${violationDays}`);
        setTimeout(() => setMessage(''), 5000);
        return;
      }

      const hasValidData = Object.values(attendanceData).some(row =>
        !weekOffDays.includes(row.day) && (
          row.status || row.hours > 0 || row.projects.length > 0
        )
      );
      if (!hasValidData) {
        toast.warn('Please provide attendance data for at least one non-week-off day');
        setTimeout(() => setMessage(''), 5000);
        return;
      }

      const invalidHours = Object.values(attendanceData).some(row =>
        !weekOffDays.includes(row.day) && (row.hours < 0 || row.hours > 24)
      );
      if (invalidHours) {
        toast.warn('Total hours must be between 0 and 24 for non-week-off days');
        setTimeout(() => setMessage(''), 5000);
        return;
      }

      setLoading(true);
      const dataToSubmit = {};

      Object.values(attendanceData).forEach(row => {
        if (!weekOffDays.includes(row.day) && (
          row.status || row.hours > 0 || row.projects.length > 0
        )) {
          const project_ids = row.projects
            .map(p => (p.projectId ? parseInt(p.projectId, 10) : null))
            .filter(id => Number.isInteger(id));

          const sub_tasks = row.projects
            .map(p =>
              (p.subtasks || []).map(subtask => ({
                project_id: parseInt(p.projectId, 10),
                sub_task: subtask.name,
                hours: subtask.hours
               
              }))
            )
            .flat()
            .filter(st => st.project_id && st.sub_task);

          dataToSubmit[row.date] = {
            date: row.date,
            action: row.status || '',
            hours: row.hours || 0, // Hours are now computed from subtasks
            project_ids: project_ids,
            sub_tasks: sub_tasks
          };
        }
      });

      if (Object.keys(dataToSubmit).length === 0) {
        toast.error('No valid attendance data to submit for non-week-off days');
        setTimeout(() => setMessage(''), 5000);
        setLoading(false);
        return;
      }

      console.log('Submitting Attendance Data:', dataToSubmit); // Debugging

      const response = await api.post('/attendance', dataToSubmit, {
        params: { employee_id: user.employeeId }
      });

      if (response.data.success) {
        toast.success('Attendance submitted successfully!');
        setTimeout(() => setMessage(''), 3000);
        await Promise.all([fetchWeeklyAttendance(), fetchDailyAttendance()]);
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      const errorMessage = error.response?.data?.detail || 'Error submitting attendance';
      toast.error(errorMessage);
      setTimeout(() => setMessage(''), 5000);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Logging out...');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily' && user?.employeeId) {
      fetchDailyAttendance();
    }
  }, [activeTab, user, selectedMonth, selectedYear]);

  const ProjectPopup = ({ onClose, onSave, existingProjects = [] }) => {
    const [selectedProjects, setSelectedProjects] = useState(existingProjects);

    useEffect(() => {
      console.log('Existing Projects in ProjectPopup:', existingProjects);
    }, [existingProjects]);

    const addProject = () => {
      setSelectedProjects([
        ...selectedProjects,
        { projectId: '', projectName: '', subtasks: [{ name: '', hours: 0 }] }
      ]);
    };

    const updateProject = (index, field, value) => {
      const updated = [...selectedProjects];
      if (field === 'projectId') {
        const project = projects.find(p => String(p.project_id) === value);
        updated[index] = {
          ...updated[index],
          projectId: value,
          projectName: project ? project.project_name : '',
          subtasks: updated[index].subtasks.length > 0 ? updated[index].subtasks : [{ name: '', hours: 0 }]
         
        };
      } else {
        updated[index][field] = value;
      }
      setSelectedProjects(updated);
    };

    const addSubtask = (projectIndex) => {
      const updated = [...selectedProjects];
      updated[projectIndex].subtasks.push({ name: '', hours: 0 });
      setSelectedProjects(updated);
    };

    const updateSubtask = (projectIndex, subtaskIndex, field, value) => {
      const updated = [...selectedProjects];
      updated[projectIndex].subtasks[subtaskIndex][field] = field === 'hours' ? parseFloat(value) || 0 : value;
      setSelectedProjects(updated);
    };

    const removeSubtask = (projectIndex, subtaskIndex) => {
      const updated = [...selectedProjects];
      updated[projectIndex].subtasks.splice(subtaskIndex, 1);
      setSelectedProjects(updated);
    };

   

    return (
      <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
            <h3 className="font-semibold text-white">Select Projects & Subtasks</h3>
            <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 p-6">
            {selectedProjects.map((project, projectIndex) => (
              <div key={projectIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <select
                    value={project.projectId || ''}
                    onChange={(e) => updateProject(projectIndex, 'projectId', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.project_id} value={String(p.project_id)}>
                        {p.project_name_commercial || p.project_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeProject(projectIndex)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subtasks:</label>
                  {project.subtasks.map((subtask, subtaskIndex) => (
                    <div key={subtaskIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={subtask.name}
                        onChange={(e) => updateSubtask(projectIndex, subtaskIndex, 'name', e.target.value)}
                        placeholder="Enter subtask"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={subtask.hours}
                        onChange={(e) => updateSubtask(projectIndex, subtaskIndex, 'hours', e.target.value)}
                        placeholder="Hours"
                        min="0"
                        max="24"
                        step="0.5"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeSubtask(projectIndex, subtaskIndex)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSubtask(projectIndex)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Subtask
                  </button>
                </div>
              </div>
            ))}
            {selectedProjects.length === 0 && (
              <p className="text-gray-500 text-center">No projects selected</p>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 p-6 border-t border-gray-200">
            <button
              onClick={addProject}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} /> Add Project
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Saving selectedProjects:', selectedProjects);
                  onSave(selectedProjects.filter(p => p.projectId && p.projectName));
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const weekDates = getWeekDates(currentWeek);

  if (!user?.employeeId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-xl font-semibold">Employee ID not found. Please login again.</div>
      </div>
    );
  }

  return (
   
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
         
          <h1 className="text-medium font-bold flex items-center gap-3">
            <Calendar className="text-blue-200" />
            Attendance Management
          </h1>
          {message && (
            <div className={`mt-3 p-3 rounded-lg text-sm text-white ${message.includes('success') ? 'bg-green-500' : 'bg-red-500'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="border-b border-gray-200 bg-gray-50">
        
          <nav className="grid grid-cols-3 gap-2 px-6">
            {[
              { id: 'add', label: 'Add Attendance', icon: Plus },
              { id: 'calendar', label: 'Calendar View', icon: Calendar },
              { id: 'daily', label: 'Daily Attendance', icon: Clock }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full justify-center py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === id
            
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'add' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                <button
                  onClick={() => navigateWeek(-1)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <ChevronLeft size={18} />
                  Previous Week
                </button>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {' '}
                    {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                </div>
                <button
                  onClick={() => navigateWeek(1)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Next Week
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div className="space-y-4">
                  {/* Default Weekoffs Info */}
                  {hasDefaultWeekoffs && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-semibold text-blue-800">Default Weekoffs</h5>
                          <p className="text-xs text-blue-600 mt-1">
                            Default weekoffs are: {defaultWeekoffs.join(', ')}
                          </p>
                        </div>
                        <button
                          onClick={setDefaultWeekoffsForEmployee}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Set Default
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Weekoff Selection */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="md:w-1/4">
                      <h4 className="text-md font-semibold text-gray-800">Select your week-off's</h4>
                      <p className="text-xs text-gray-500 mt-1">Choose up to 2 days (Default: Saturday, Sunday)</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                          const isDefault = defaultWeekoffs.includes(day);
                          const isSelected = weekOffDays.includes(day);
                          return (
                            <label 
                              key={day} 
                              className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer select-none transition-colors ${
                                isDefault 
                                  ? 'border-blue-300 bg-blue-50 text-blue-800' 
                                  : isSelected
                                  ? 'border-gray-400 bg-gray-100 text-gray-800'
                                  : 'border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleWeekOff(day)}
                                disabled={loading}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                isSelected 
                                  ? 'border-blue-600 bg-blue-600' 
                                  : 'border-gray-400'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="flex items-center gap-1">
                                {day}
                                {isDefault && (
                                  <span className="text-xs text-blue-600 font-medium">(Default)</span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="md:w-1/4 flex md:justify-end">
                      <button
                        onClick={submitWeekOffs}
                        disabled={loading || weekOffDays.length === 0}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        Save Week-Offs
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                      <tr>
                        <th className="px-4 py-4 text-left font-semibold">Day</th>
                        <th className="px-4 py-4 text-left font-semibold">Date</th>
                        <th className="px-4 py-4 text-left font-semibold">Action</th>
                        <th className="px-4 py-4 text-left font-semibold">Status</th>
                        <th className="px-4 py-4 text-left font-semibold">Hours</th>
                        <th className="px-4 py-4 text-left font-semibold">Projects & Subtasks</th>
                        <th className="px-4 py-4 text-left font-semibold">Actions</th>
                        <th className="px-4 py-4 text-left font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(attendanceData).map(([index, row]) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 font-medium text-gray-900">{row.day}</td>
                          <td className="px-4 py-4 text-gray-700">
                            {new Date(row.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-4">
                            {weekOffDays.includes(row.day) ? (
                              <span className="text-gray-400 text-sm">Week-off</span>
                            ) : (
                              <select
                                value={row.status}
                                onChange={(e) => handleStatusChange(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                              >
                                <option value="">Select Action</option>
                                <option value="Present">Present</option>
                                <option value="Leave">Leave</option>
                                <option value="WFH">Work From Home</option>
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {weekOffDays.includes(row.day) ? (
                              <span className="text-gray-400 text-sm">Week-off</span>
                            ) : (
                              <span className="text-gray-900 text-sm">{row.status || 'Not set'}</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {weekOffDays.includes(row.day) ? (
                              <span className="text-gray-400 text-sm">N/A</span>
                            ) : (
                              <span className="text-gray-900">{row.hours.toFixed(2)} hrs</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {weekOffDays.includes(row.day) ? (
                              <span className="text-gray-400 text-sm">N/A</span>
                            ) : (
                              <div className="space-y-2">
                                <button
                                  onClick={() => openProjectPopup(index)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-sm"
                                >
                                  <Edit3 size={16} />
                                  {row.projects.length > 0 ? 'Edit Projects' : 'Projects'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.submitted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {row.submitted ? 'Submitted' : 'Not Submitted'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              title="View details"
                              onClick={() => handleShowProjects({ date: row.date, projects: row.projects, hours: row.hours, status: row.status })}
                              className="inline-flex items-center justify-center p-2 text-blue-600 rounded-full "
                              disabled={weekOffDays.includes(row.day)}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={submitAttendance}
                  disabled={loading}
                  className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <Save size={20} />
                  {loading ? 'Submitting...' : 'Submit Attendance'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Calendar View</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedYear, selectedMonth - 1, 1);
                      setSelectedMonth(newDate.getMonth());
                      setSelectedYear(newDate.getFullYear());
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <option key={i} value={new Date().getFullYear() - 2 + i}>
                          {new Date().getFullYear() - 2 + i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedYear, selectedMonth + 1, 1);
                      setSelectedMonth(newDate.getMonth());
                      setSelectedYear(newDate.getFullYear());
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="grid grid-cols-7 bg-gradient-to-r from-gray-600 to-blue-600">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-4 text-center font-semibold text-white">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {(() => {
                    const firstDay = new Date(selectedYear, selectedMonth, 1);
                    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
                    const startDate = new Date(firstDay);
                    startDate.setDate(startDate.getDate() - firstDay.getDay());

                    const days = [];
                    const currentDate = new Date(startDate);

                    for (let i = 0; i < 42; i++) {
                      const dateStr = formatDateLocal(currentDate);
                      const isCurrentMonth = currentDate.getMonth() === selectedMonth;
                      const isToday = dateStr === formatDateLocal(new Date());
                      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

                      const attendanceRecord = filteredDailyAttendance.find(record => record.date === dateStr);
                      const isWeekOff = isWeekOffForDate(currentDate);

                      days.push(
                        <div
                          key={dateStr}
                          className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                            } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                        >
                          <div className={`text-sm font-medium mb-2 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                            } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                            {currentDate.getDate()}
                          </div>
                          {isWeekOff && isCurrentMonth ? (
                            <div className="space-y-1">
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                Week-off
                              </div>
                            </div>
                          ) : attendanceRecord && isCurrentMonth ? (
                            <div className="space-y-1">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${attendanceRecord.status === 'Present'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : attendanceRecord.status === 'WFH'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : attendanceRecord.status === 'Leave'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                {attendanceRecord.status}
                              </div>
                              {attendanceRecord.hours > 0 && (
                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {attendanceRecord.hours}h
                                </div>
                              )}
                              {attendanceRecord.projects && attendanceRecord.projects.length > 0 && (
                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {attendanceRecord.projects.length} project{attendanceRecord.projects.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                      currentDate.setDate(currentDate.getDate() + 1);
                    }
                    return days;
                  })()}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                    <span className="text-sm text-gray-700">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                    <span className="text-sm text-gray-700">Work From Home</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                    <span className="text-sm text-gray-700">Leave</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                    <span className="text-sm text-gray-700">Week-off</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                    <span className="text-sm text-gray-700">Today</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Daily Attendance Records</h3>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="flex gap-2 items-center">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="Full-Time">Full-Time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Search className="h-4 w-4 text-gray-500" />
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Search by date"
                    />
                    {searchDate && (
                      <button
                        onClick={() => setSearchDate('')}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredDailyAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-gray-600 font-medium">No attendance records found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchDate
                      ? 'No records found for the selected date'
                      : `No records found for ${new Date(selectedYear, selectedMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <PageSizeSelect
                      pageSize={pageSize}
                      onChange={handlePageSizeChange}
                      options={[10, 20, 30, 40, 50]}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Day
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hours
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Projects
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedData(filteredDailyAttendance).map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'Present'
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'Leave'
                                  ? 'bg-red-100 text-red-800'
                                  : record.status === 'WFH'
                                    ? 'bg-purple-100 text-purple-800'
                                    : record.status === 'Week-off'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {record.hours.toFixed(2)} hrs
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <button
                                  onClick={() => handleShowProjects(record)}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    className="mt-3"
                    align="right"
                    hideInfo={true}
                    hidePageSize={true}
                    currentPage={currentPage}
                    totalPages={getTotalPages(filteredDailyAttendance.length)}
                    pageSize={pageSize}
                    totalItems={filteredDailyAttendance.length}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showProjectPopup && (
        <ProjectPopup
          onClose={() => setShowProjectPopup(false)}
          onSave={handleProjectSelect}
          existingProjects={selectedRowIndex !== null ? attendanceData[selectedRowIndex]?.projects || [] : []}
        />
      )}

      {showProjectModal && selectedRecord && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
              <h3 className="font-semibold text-white">
                Projects for {new Date(selectedRecord.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <button
                onClick={handleCloseProjectModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols- gap-2 text-sm">
                <div className="  rounded-lg p-5">
                  <div className="text-gray-500">Date</div>
                  <div className="font-medium text-gray-800">
                    {new Date(selectedRecord.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className=" rounded-lg p-5">
                  <div className="text-gray-500">Hours</div>
                  <div className="font-medium text-gray-800">{selectedRecord.hours.toFixed(2)}</div>
                </div>
                <div className=" rounded-lg p-5">
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium text-gray-800">{selectedRecord.status || 'Not set'}</div>
                </div>
                <div className="  rounded-lg p-5">
                  <div className="text-gray-500">Projects</div>
                  <div className="font-medium text-gray-800">{selectedRecord.projects?.length || 0}</div>
                </div>
              </div>
              {selectedRecord.projects && selectedRecord.projects.length > 0 ? (
                selectedRecord.projects.map((project, index) => (
                  <div key={index} className=" rounded-lg p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{project.projectName}</h4>
                      <span className="text-sm text-gray-500">Project {index + 1}</span>
                    </div>
                    {project.subtasks && project.subtasks.length > 0 ? (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Subtasks:</h5>
                        <div className="space-y-1">
                          {project.subtasks.map((subtask, subIndex) => (
                            <div key={subIndex} className="flex items-center text-sm text-gray-600">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                              {subtask.name} - {subtask.hours} hours
                             
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No subtasks assigned</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No projects found for this date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-transparent bg-opacity-30 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      </div>
   
  );
};

export default AddAttendance;