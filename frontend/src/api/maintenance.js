import axios from './axiosConfig';

export const getMaintenanceRecords = async () => {
  const response = await axios.get('/assets/maintenance/');
  return response.data;
};

export const createMaintenance = async (record) => {
  const response = await axios.post('/assets/maintenance/', record);
  return response.data;
};

export const updateMaintenance = async (id, record) => {
  const response = await axios.put(`/assets/maintenance/${id}`, record);
  return response.data;
};

export const deleteMaintenance = async (id) => {
  await axios.delete(`/assets/maintenance/${id}`);
};
