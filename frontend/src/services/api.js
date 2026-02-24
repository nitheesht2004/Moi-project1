import axios from 'axios';

/**
 * Axios instance for all API calls.
 *
 * BASE URL STRATEGY
 * ─────────────────
 * • Production (Vercel): frontend and API share the same domain, so `/api`
 *   resolves correctly with no extra configuration.
 * • Local development: Vite's proxy (vite.config.js) forwards `/api → http://localhost:5000`
 *   so the same relative `/api` path works seamlessly.
 *
 * IMPORTANT: do NOT set VITE_API_URL to a localhost address — that would
 * break CORS on Vercel. Leave it unset and rely on the proxy locally.
 */
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

// ── Request interceptor — attach JWT from localStorage ──────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor — handle auth errors globally ─────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear stale credentials.
            // Navigation is handled by AuthContext / ProtectedRoute — not here.
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export default api;
