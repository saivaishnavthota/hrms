import axios from 'axios';

// Configurable Base URL with sensible defaults
const BASE_URL = import.meta.env.VITE_API_URL;

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

// Export the axios instance for custom requests
export default api;