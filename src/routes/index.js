const { Router } = require('express');
const transferRouter = require('./transfer');
const router = Router();

router.use('/transfers', transferRouter);

module.exports = router;
