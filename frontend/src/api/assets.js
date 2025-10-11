import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

export const getAssets = async (filters = {}) => {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.asset_type) params.asset_type = filters.asset_type;
  const res = await axios.get(`${API_BASE}/assets/assets/`, { params });
  return res.data;
};

export const getAssetById = async (id) => {
  const res = await axios.get(`${API_BASE}/assets/assets/${id}`);
  return res.data;
};

export const createAsset = async (asset) => {
  const res = await axios.post(`${API_BASE}/assets/assets/`, asset);
  return res.data;
};

export const updateAsset = async (id, asset) => {
  const res = await axios.put(`${API_BASE}/assets/assets/${id}`, asset);
  return res.data;
};

export const deleteAsset = async (id) => {
  await axios.delete(`${API_BASE}/assets/assets/${id}`);
};
