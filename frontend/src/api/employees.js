import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

// ===== Employees =====
export const getEmployees = async (filters = {}) => {
  const params = {};
  if (filters.name) params.name = filters.name;
  if (filters.role) params.role = filters.role;
  const res = await axios.get(`${API_BASE}/employees/`, { params });
  return res.data;
};

export const getEmployeeById = async (id) => {
  const res = await axios.get(`${API_BASE}/employees/${id}`);
  return res.data;
};

export const createEmployee = async (employee) => {
  const res = await axios.post(`${API_BASE}/employees/`, employee);
  return res.data;
};

export const updateEmployee = async (id, employee) => {
  const res = await axios.put(`${API_BASE}/employees/${id}`, employee);
  return res.data;
};

export const deleteEmployee = async (id) => {
  await axios.delete(`${API_BASE}/employees/${id}`);
};
