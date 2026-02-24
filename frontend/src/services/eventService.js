import api from './api';

export const eventService = {
    getAll: async () => {
        const response = await api.get('/events');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/events', data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/events/${id}`);
        return response.data;
    }
};
