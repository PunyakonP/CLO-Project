const express = require('express');

const router = express.Router();

router.post('/leadconversion', (req, res) => {
    const JsonData = req.body
    console.log(JsonData);
    res.send("Sucess");
});

module.exports = router;
