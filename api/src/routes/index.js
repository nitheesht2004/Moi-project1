const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const entryRoutes = require('./entry.routes');
const eventRoutes = require('./event.routes');
const locationRoutes = require('./location.routes');
const exportRoutes = require('./export.routes');

router.use('/auth', authRoutes);
router.use('/entries', entryRoutes);
router.use('/events', eventRoutes);
router.use('/locations', locationRoutes);
router.use('/export', exportRoutes);

module.exports = router;
