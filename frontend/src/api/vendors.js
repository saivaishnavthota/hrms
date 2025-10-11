import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

// ===== Vendors =====
export const getVendors = async (vendor_type) => {
  const params = {};
  if (vendor_type) params.vendor_type = vendor_type;
  const res = await axios.get(`${API_BASE}/assets/vendors/`, { params });
  return res.data;
};

export const getVendorById = async (id) => {
  const res = await axios.get(`${API_BASE}/assets/vendors/${id}`);
  return res.data;
};

export const createVendor = async (vendor) => {
  const res = await axios.post(`${API_BASE}/assets/vendors/`, vendor);
  return res.data;
};

export const updateVendor = async (id, vendor) => {
  const res = await axios.put(`${API_BASE}/assets/vendors/${id}`, vendor);
  return res.data;
};

export const deleteVendor = async (id) => {
  await axios.delete(`${API_BASE}/assets/vendors/${id}`);
};
