import axios from "axios";

// 1. Check for the environment variable REACT_APP_API_URL (set on Vercel).
// 2. Fall back to "/api" for local development (which uses the proxy setting).
const BASE_URL = process.env.REACT_APP_API_URL || "/api"; 

const api = axios.create({
  baseURL: BASE_URL,
});
export default api;