import axios from "axios";
import { clearSession, getToken } from "@/services/authStorage";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json"
  }
});
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession();                    // remove expired token
      window.location.href = "/login";   
    }
    return Promise.reject(error);
  }
);


export default api;