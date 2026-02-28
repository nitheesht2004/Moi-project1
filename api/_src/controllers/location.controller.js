const locationService = require('../services/location.service');

exports.getAllLocations = async (req, res, next) => {
    try {
        const locations = await locationService.getAllLocations();
        res.json(locations);
    } catch (error) {
        next(error);
    }
};

exports.getEntriesByLocation = async (req, res, next) => {
    try {
        const entries = await locationService.getEntriesByLocation(req.params.id);
        res.json(entries);
    } catch (error) {
        next(error);
    }
};
