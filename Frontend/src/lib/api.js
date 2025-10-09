import axios from 'axios';

// Configurable Base URL with sensible defaults
const BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      // Redirect to login if needed
    }
    return Promise.reject(error);
  }
);

// Authentication API endpoints
export const authAPI = {
  // POST /users/login - User authentication/login
  login: async (credentials) => {
    // Backend expects OAuth2PasswordRequestForm (x-www-form-urlencoded)
    const form = new URLSearchParams();
    form.append('username', credentials.email.trim());
    form.append('password', credentials.password);

    const response = await api.post('/users/login', form, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // POST /users/forgot-password - Initiates password reset process
  forgotPassword: async (email) => {
    const response = await api.post('/users/forgot-password', { email });
    return response.data;
  },

  // POST /users/verify-otp - Verifies OTP sent to user's email
  verifyOTP: async (email, otp) => {
    const response = await api.post('/users/verify-otp', { email, otp });
    return response.data;
  },

  // POST /users/change-password - Changes password after OTP verification
  changePassword: async (email, newPassword) => {
    const response = await api.post('/users/change-password', { 
      email, 
      new_password: newPassword 
    });
    return response.data;
  },

  // POST /users/reset-password - Resets password using current password
  resetPassword: async (data) => {
    const response = await api.post('/users/reset-password', {
      email: data.email,
      currentPassword: data.currentPassword,
      new_password: data.new_password
    });
    return response.data;
  },

  // POST /users/reset-onboarding-password - Resets password for onboarding employees
  resetOnboardingPassword: async (data) => {
    const response = await api.post('/users/reset-onboarding-password', {
      employee_id: data.employee_id,
      new_password: data.new_password
    });
    return response.data;
  }
};

// User management API endpoints
export const userAPI = {
  // GET /users/managers - Fetches list of all managers
  getManagers: async () => {
    const response = await api.get('/users/managers');
    return response.data;
  },

  // GET /users/hrs - Fetches list of all HR personnel
  getHRs: async () => {
    const response = await api.get('/users/hrs');
    return response.data;
  },

  // GET /users/employees - Fetches all employees with assigned HRs and Managers
  getEmployees: async () => {
    const response = await api.get('/users/employees');
    return response.data;
  },

  // GET /users/onboarded-employees - Returns onboarded employees details including total count
  getOnboardedEmployeesCount: async () => {
    const response = await api.get('/users/onboarded-employees');
    // Endpoint returns an object with `count` and employee details list
    return response.data?.count ?? null;
  },

  // POST /users/hr/approve - HR approves employee onboarding
  approveEmployee: async (employeeData) => {
    const response = await api.post('/users/hr/approve', employeeData);
    return response.data;
  }
};

// Leave management API endpoints
export const leaveAPI = {
  // POST /leave/apply_leave - Employee applies for leave
  applyLeave: async (data) => {
    const payload = {
      employee_id: data.employee_id,
      leave_type: data.leave_type,
      reason: data.reason,
      start_date: data.start_date,
      end_date: data.end_date,
      // Optional flag for half-day leave; backend accepts extra keys
      half_day: !!data.half_day,
    };
    const response = await api.post('/leave/apply_leave', payload);
    return response.data;
  },

  // GET /leave/all_leaves/{employee_id} - Employee leave history
  getEmployeeLeaves: async (employeeId) => {
    const response = await api.get(`/leave/all_leaves/${employeeId}`);
    return response.data;
  },

  // GET /leave/leave_balances/{employee_id} - Current leave balances
  getLeaveBalance: async (employeeId) => {
    const response = await api.get(`/leave/leave_balances/${employeeId}`);
    return response.data;
  },
};

// Onboarding API endpoints
export const onboardingAPI = {
  // GET /onboarding/all - Get all onboarding employees
  getAllOnboardingEmployees: async () => {
    const response = await api.get('/onboarding/all');
    return response.data;
  },

  // GET /onboarding/emp/{employee_id} - Get employee documents
  getEmployeeDocuments: async (employeeId) => {
    const response = await api.get(`/onboarding/emp/${employeeId}`);
    return response.data;
  },

  // GET /onboarding/details/{employee_id} - Get employee details
  getEmployeeDetails: async (employeeId) => {
    const response = await api.get(`/onboarding/details/${employeeId}`);
    return response.data;
  },
  handleAssignEmployee: async (employeeData) => {
    const response = await api.post('/onboarding/hr/assign', employeeData);
    return response.data;
  },
  handleReassignEmployee: async (employeeData) => {
    const response = await api.post('/onboarding/hr/reassign', employeeData);
    return response.data;
  },
  // POST /onboarding/hr/approve/{onboarding_id} - Approve employee
  approveEmployee: async (onboardingId) => {
    const response = await api.post(`/onboarding/hr/approve/${onboardingId}`);
    return response.data;
  },

  // DELETE /onboarding/hr/reject/{onboarding_id} - Reject employee
  rejectEmployee: async (onboardingId) => {
    const response = await api.delete(`/onboarding/hr/reject/${onboardingId}`);
    return response.data;
  },

  // DELETE /onboarding/hr/delete/{onboarding_id} - Delete employee
  deleteEmployee: async (onboardingId) => {
    const response = await api.delete(`/onboarding/hr/delete/${onboardingId}`);
    return response.data;
  }
};

// Attendance API endpoints
export const attendanceAPI = {
  // GET /attendance/active-projects - Get active projects for attendance
  getActiveProjects: async (params = {}) => {
    const response = await api.get('/attendance/active-projects', { params });
    return response.data;
  },

  // POST /attendance/ - Submit attendance
  submitAttendance: async (data) => {
    const { employee_id, ...attendanceData } = data;
    const response = await api.post('/attendance/', attendanceData, {
      params: { employee_id }
    });
    return response.data;
  },

  // GET /attendance/weekly - Get weekly attendance
  getWeeklyAttendance: async (params = {}) => {
    const response = await api.get('/attendance/weekly', { params });
    return response.data;
  },

  // GET /attendance/daily - Get daily attendance
  getDailyAttendance: async (params = {}) => {
    const response = await api.get('/attendance/daily', { params });
    return response.data;
  },

  // GET /attendance/mgr-assigned - Get manager assigned attendance
  getManagerAssignedAttendance: async (params = {}) => {
    const response = await api.get('/attendance/mgr-assigned', { params });
    return response.data;
  },

  // GET /attendance/hr-assigned - Get HR assigned attendance
  getHRAssignedAttendance: async (params = {}) => {
    const response = await api.get('/attendance/hr-assigned', { params });
    return response.data;
  },

  // GET /attendance/hr-daily - Get HR daily attendance
  getHRDailyAttendance: async (params = {}) => {
    const response = await api.get('/attendance/hr-daily', { params });
    return response.data;
  }
};

// Expenses API endpoints
export const expensesAPI = {
  // POST /expenses/submit-exp - Submit expense request
  submitExpense: async (data) => {
    const response = await api.post('/expenses/submit-exp', data);
    return response.data;
  },

  // GET /expenses/my-expenses - Get employee's expenses
  getMyExpenses: async (params = {}) => {
    console.log('API Call - getMyExpenses with params:', params);
    const response = await api.get('/expenses/my-expenses', { params });
    console.log('API Response:', response.data);
    return response.data;
  },

  // GET /expenses/mgr-exp-list - Get manager's expense list
  getManagerExpenseList: async (params = {}) => {
    const response = await api.get('/expenses/mgr-exp-list', { params });
    return response.data;
  },

  // PUT /expenses/mgr-upd-status/{request_id} - Update expense status by manager
  updateExpenseStatusByManager: async (requestId, data) => {
    const formData = new FormData();
    formData.append('manager_id', data.manager_id);
    formData.append('status', data.status);
    if (data.reason) formData.append('reason', data.reason);
    
    const response = await api.put(`/expenses/mgr-upd-status/${requestId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // GET /expenses/hr-exp-list - Get HR expense list
  getHRExpenseList: async (params = {}) => {
    const response = await api.get('/expenses/hr-exp-list', { params });
    return response.data;
  },

  // PUT /expenses/hr-upd-status/{request_id} - Update expense status by HR
  updateExpenseStatusByHR: async (requestId, data) => {
    const formData = new FormData();
    formData.append('hr_id', data.hr_id);
    formData.append('status', data.status);
    if (data.reason) formData.append('reason', data.reason);
    
    const response = await api.put(`/expenses/hr-upd-status/${requestId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // GET /expenses/acc-mgr-exp-list - Get account manager expense list
  getAccountManagerExpenseList: async (params = {}) => {
    const response = await api.get('/expenses/acc-mgr-exp-list', { params });
    return response.data;
  },

  // PUT /expenses/acc-mgr-upd-status/{request_id} - Update expense status by account manager
  updateExpenseStatusByAccountManager: async (requestId, data) => {
    const formData = new FormData();
    formData.append('acc_mgr_id', data.acc_mgr_id);
    formData.append('status', data.status);
    if (data.reason) formData.append('reason', data.reason);
    
    const response = await api.put(`/expenses/acc-mgr-upd-status/${requestId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Projects API endpoints
export const projectsAPI = {
  // POST /projects/ - Create new project
  createProject: async (data) => {
    const response = await api.post('/projects/', data);
    return response.data;
  },

  // GET /projects/get_projects - Get all projects
  getProjects: async (params = {}) => {
    const response = await api.get('/projects/get_projects', { params });
    return response.data;
  },

  // PUT /projects/{project_id}/status - Update project status
  updateProjectStatus: async (projectId, data) => {
    const response = await api.put(`/projects/${projectId}/status`, data);
    return response.data;
  },

  // PUT /projects/{project_id} - Update project
  updateProject: async (projectId, data) => {
    const response = await api.put(`/projects/${projectId}`, data);
    return response.data;
  },

  // GET /projects/all-projects - Get all projects
  getAllProjects: async (params = {}) => {
    const response = await api.get('/projects/all-projects', { params });
    return response.data;
  },

  // GET /projects/manager-employees - Get manager employees
  getManagerEmployees: async (params = {}) => {
    const response = await api.get('/projects/manager-employees', { params });
    return response.data;
  },

  // POST /projects/employees/{emp_id}/projects - Assign projects to employee
  assignProjectsToEmployee: async (empId, data) => {
    const response = await api.post(`/projects/employees/${empId}/projects`, data);
    return response.data;
  }
};

// Weekoff API endpoints
export const weekoffAPI = {
  // POST /weekoffs/ - Create weekoff request
  createWeekoff: async (data) => {
    const response = await api.post('/weekoffs/', data);
    return response.data;
  },

  // GET /weekoffs/{employee_id} - Get employee weekoffs
  getEmployeeWeekoffs: async (employeeId) => {
    const response = await api.get(`/weekoffs/${employeeId}`);
    return response.data;
  }
};


// Locations API endpoints
export const locationsAPI = {
  // GET /locations/ - Get all locations
  getLocations: async () => {
    const response = await api.get('/locations/');
    return response.data;
  },

  // POST /locations/ - Add new location
  addLocation: async (locationData) => {
    const response = await api.post('/locations/', locationData);
    return response.data;
  }
};

// Calendar/Holidays API endpoints
export const calendarAPI = {
  // GET /calendar/ - Get all holidays
  getHolidays: async (locationId = null) => {
    const params = locationId ? { location_id: locationId } : {};
    const response = await api.get('/calendar/', { params });
    return response.data;
  },

  // POST /calendar/add - Add new holiday
  addHoliday: async (holidayData) => {
    const response = await api.post('/calendar/add', holidayData);
    return response.data;
  },

  // DELETE /calendar/{holiday_id} - Delete holiday
  deleteHoliday: async (holidayId) => {
    const response = await api.delete(`/calendar/${holidayId}`);
    return response.data;
  },

  // GET /calendar/by-location/{location_id} - Get holidays by location
  getHolidaysByLocation: async (locationId) => {
    const response = await api.get(`/calendar/by-location/${locationId}`);
    return response.data;
  }
};

// Policy API endpoints
export const policiesAPI = {
  // POST /policies/ - Create a policy
  createPolicy: async (formData, hrId) => {
    try {
      const response = await api.post(`/policies/?hr_id=${hrId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Create Policy Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;}},
 
  // GET /policies/{location_id} - Get policies by location
  getPoliciesByLocation: async (locationId, userIdObj) => {
    const query = new URLSearchParams(userIdObj).toString();
    const response = await api.get(`/policies/${locationId}?${query}`);
    return response.data;
  },
 
  // GET /policies/view/{policy_id} - Get single policy details
  getPolicy: async (policyId, userIdObj) => {
    const query = new URLSearchParams(userIdObj).toString();
    const response = await api.get(`/policies/view/${policyId}?${query}`);
    return response.data;
  },
 
  // PUT /policies/{policy_id} - Update a policy
  updatePolicy: async (policyId, formData, hrId) => {
    const response = await api.put(`/policies/${policyId}?hr_id=${hrId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
 
  // DELETE /policies/{policy_id} - Delete a policy
  deletePolicy: async (policyId, hrId) => {
    const response = await api.delete(`/policies/${policyId}?hr_id=${hrId}`);
    return response.data;
  },
 
  // GET /policies/download/{policy_id} - Download a policy file
  downloadPolicy: async (policyId, userIdObj) => {
    const query = new URLSearchParams(userIdObj).toString();
    const response = await api.get(`/policies/download/${policyId}?${query}`, {
      responseType: 'blob'
    });
    return response.data;
  },
};
 
// Policy Categories API endpoints
export const categoriesAPI = {
  // GET /policies/categories - Get all categories
  getCategories: async (userIdObj = {}) => {
    const query = new URLSearchParams(userIdObj).toString();
    const response = await api.get(`/policies/categories?${query}`);
    return response.data;
  },
 
  // POST /policies/categories - Create a category
  createCategory: async (categoryData, hrId) => {
    const response = await api.post(`/policies/categories?hr_id=${hrId}`, categoryData);
    return response.data;
  },
 
  // PUT /policies/categories/{category_id} - Update a category
  updateCategory: async (categoryId, categoryData, hrId) => {
    const response = await api.put(`/policies/categories/${categoryId}?hr_id=${hrId}`, categoryData);
    return response.data;
  },
 
  // DELETE /policies/categories/{category_id} - Delete a category
  deleteCategory: async (categoryId, hrId) => {
    const response = await api.delete(`/policies/categories/${categoryId}?hr_id=${hrId}`);
    return response.data;
  },
};

// Export the axios instance for custom requests
export default api;
