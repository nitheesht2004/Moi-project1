const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entry.controller');
const { authenticate } = require('../middlewares/auth');
const { validateEntry } = require('../middlewares/validators');

router.use(authenticate);

router.get('/', entryController.getAllEntries);
router.get('/:id', entryController.getEntryById);
router.post('/', validateEntry, entryController.createEntry);
router.put('/:id', validateEntry, entryController.updateEntry);
router.delete('/:id', entryController.deleteEntry);

module.exports = router;
