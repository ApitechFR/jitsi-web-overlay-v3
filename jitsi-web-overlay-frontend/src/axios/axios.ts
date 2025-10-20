import axios from 'axios';
import { getCachedRuntimeConfig } from '@/config/runtimeConfig';

function getApiBaseUrl(): string {
  const cfg = getCachedRuntimeConfig();
  return cfg?.VITE_API_URL || '/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});


export default api;
