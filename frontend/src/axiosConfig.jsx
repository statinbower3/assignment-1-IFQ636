import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: 'http://localhost:5001', // local
  baseURL: 'http://3.106.127.224:5001', // live  ← change 5000 to 5001
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
