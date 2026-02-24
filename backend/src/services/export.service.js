const ExcelJS = require('exceljs');
const Entry = require('../models/entry.model');

exports.exportToExcel = async (userId, eventId, filters = {}) => {
    // Fetch entries filtered by user and event
    const entries = await Entry.findAll(userId, eventId, filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Entries');

    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Notes', key: 'notes', width: 30 }
    ];

    entries.forEach(entry => {
        worksheet.addRow({
            id: entry.id,
            name: entry.name,
            location: entry.location,
            amount: entry.amount,
            date: entry.date,
            notes: entry.notes
        });
    });

    return await workbook.xlsx.writeBuffer();
};
