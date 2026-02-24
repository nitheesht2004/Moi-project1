import api from './api';

// Real backend authentication
// Mock auth has been disabled to use actual JWT tokens from backend
const MOCK_AUTH = false; // ✅ Changed to false to use real backend

const mockLogin = async (username, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Temporary test credentials
    if (username === 'admin' && password === 'admin123') {
        return {
            token: 'mock-jwt-token-' + Date.now(),
            user: {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin'
            }
        };
    }

    throw new Error('Invalid credentials');
};

export const authService = {
    login: async (username, password) => {
        // Use mock authentication for testing
        if (MOCK_AUTH) {
            return await mockLogin(username, password);
        }

        // Real backend authentication
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    },

    logout: async () => {
        if (MOCK_AUTH) {
            return { success: true };
        }

        const response = await api.post('/auth/logout');
        return response.data;
    },

    refreshToken: async (refreshToken) => {
        if (MOCK_AUTH) {
            return { token: 'mock-refreshed-token-' + Date.now() };
        }

        const response = await api.post('/auth/refresh', { refreshToken });
        return response.data;
    }
};
