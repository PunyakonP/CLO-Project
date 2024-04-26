const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('TCAP Api to meta. ')
});

module.exports = router;
