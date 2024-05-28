const express = require('express');
const router = express.Router();
const transferController = require('../controllers/TransferController');

router.get('/booking', transferController.getBookingLead);
router.get('/delivery', transferController.getDeliveryLead);
router.get('/qualified', transferController.getQuelifiedLead);
router.post('/initial', transferController.getInitialLead);

module.exports = router;
