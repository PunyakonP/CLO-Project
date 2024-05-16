const express = require('express');
const router = express.Router();
const rootController = require('../controllers/RootController');

router.get('/', rootController.getApiIdentity);
router.get('/testip', rootController.getApiIdentity);

module.exports = router;
