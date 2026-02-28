const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', locationController.getAllLocations);
router.get('/:id/entries', locationController.getEntriesByLocation);

module.exports = router;
