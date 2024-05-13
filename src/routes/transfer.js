const express = require('express');
const router = express.Router();
const transferController = require('../controllers/TransferController');

router.get('/booking', transferController.getBookingLead);
router.get('/delivery', transferController.getAllTransfers);
router.get('/quelified', transferController.getAllTransfers);
router.post('/inittial', transferController.getAllTransfers);

module.exports = router;
