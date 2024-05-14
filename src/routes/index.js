const { Router } = require('express');
const transferRouter = require('./transfer');
const webhookRouter = require('./webhook');
const router = Router();

router.use('/transfers', transferRouter);
router.use('/webhooks', webhookRouter);

module.exports = router;
