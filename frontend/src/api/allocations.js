import axios from './axiosConfig';

export const getAllocations = async () => {
  const response = await axios.get('/assets/allocations/');
  return response.data;
};

export const createAllocation = async (allocation) => {
  const response = await axios.post('/assets/allocations/', allocation);
  return response.data;
};

export const updateAllocation = async (id, allocation) => {
  const response = await axios.put(`/assets/allocations/${id}`, allocation);
  return response.data;
};

export const deleteAllocation = async (id) => {
  await axios.delete(`/assets/allocations/${id}`);
};
