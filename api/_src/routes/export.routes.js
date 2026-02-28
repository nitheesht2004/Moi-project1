const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/excel', exportController.exportToExcel);

module.exports = router;
