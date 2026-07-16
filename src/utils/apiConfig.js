import axios from 'axios';
import { isSessionExpired, endSession } from './session';

// Set the base URL dynamically based on the environment
const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
});

// Attach the token to every request. If it has already lapsed, sign out instead
// of sending a request we know will be rejected.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (isSessionExpired(token)) {
        endSession();
        return Promise.reject(new axios.CanceledError('Your session has expired. Please sign in again.'));
      }
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// A 401 from this API only ever means "no longer authenticated" — permission
// denials come back as 403 and a bad password as 400/404 — so treat it as a dead
// session and sign out rather than letting each page render its own "failed".
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      endSession();
    }
    return Promise.reject(error);
  }
);

export default API;
