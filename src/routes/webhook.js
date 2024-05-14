const express = require('express');
const router = express.Router();
const webHookController = require('../controllers/WebHookController');

router.get('/facebook', webHookController.verifyRequestSignature);
router.post('/facebook', webHookController.webHookFacebook);

module.exports = router;
