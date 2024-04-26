const express = require('express');
const router = express.Router();
const transferController = require('../controllers/TransferController');

router.get('/', transferController.getAllTransfers);

module.exports = router;
