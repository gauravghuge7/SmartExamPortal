import axios from 'axios';

// const BASE_URL = "http://localhost:5000/api/v1"; 
const BASE_URL = "https://smartexamportal-production.up.railway.app/api/v1"; 

const axiosInstance = axios.create();

axiosInstance.defaults.baseURL = BASE_URL;
axiosInstance.defaults.withCredentials = true;
axiosInstance.defaults.proxy = true;

export default axiosInstance;