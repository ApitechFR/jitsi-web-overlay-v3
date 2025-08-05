import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem(
  'auth'
)}`;

export default api;
