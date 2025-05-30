import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Configuração do Axios
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export { api }; 