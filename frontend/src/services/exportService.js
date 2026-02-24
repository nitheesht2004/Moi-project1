import api from './api';

export const exportService = {
    exportToExcel: async (filters = {}) => {
        const response = await api.get('/export/excel', {
            params: filters,
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'entries.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
