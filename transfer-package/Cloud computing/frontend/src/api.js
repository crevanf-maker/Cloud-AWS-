import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({ baseURL });

api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = token;
    }
  } catch (err) {
    // No authenticated session yet (e.g. on the login page) - proceed without a token.
  }
  return config;
});

export default api;
