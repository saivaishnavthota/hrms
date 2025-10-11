import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

const instance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
