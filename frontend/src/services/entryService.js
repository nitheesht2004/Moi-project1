import api from './api';

export const entryService = {
    getAll: async (eventId, filters = {}) => {
        const params = { eventId, ...filters };
        const response = await api.get('/entries', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/entries/${id}`);
        return response.data;
    },

    create: async (eventId, data) => {
        const response = await api.post('/entries', { ...data, eventId });
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/entries/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/entries/${id}`);
        return response.data;
    }
};
