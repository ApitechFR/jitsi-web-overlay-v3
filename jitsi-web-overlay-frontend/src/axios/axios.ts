import axios from 'axios';
import { getCachedRuntimeConfig } from '../config/runtimeConfig';


function getBaseUrl() {
  const cfg = getCachedRuntimeConfig();
  return cfg?.VITE_API_URL || '';
}

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});


export default api;
