const Location = require('../models/location.model');
const Entry = require('../models/entry.model');

exports.getAllLocations = async () => {
    return await Location.findAll();
};

exports.getEntriesByLocation = async (locationId) => {
    return await Entry.findByLocation(locationId);
};
