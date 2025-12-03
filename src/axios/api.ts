import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: 'https://lzg9znsti1.execute-api.us-east-1.amazonaws.com', // Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
