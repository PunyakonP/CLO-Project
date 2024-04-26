const express = require('express');
const router = express.Router();
const rootController = require('../controllers/RootController');

router.get('/', rootController.getApiIdentity);

module.exports = router;
