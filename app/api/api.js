const express = require('express');
const router = express.Router();
require('dotenv').config();

function checkToken(req, res, next) {
  let receivedToken = req.body.token || req.query.token;
  let actualToken = process.env.VK_ACCESS_TOKEN;
  if (receivedToken === actualToken) {
    next();
  } else {
    res.json({ error: 'token' });
  }
}

router.use(checkToken);

router.use('/words', require('./words').router);
router.use('/ads', require('./ads').router);

router.post('/', (req, res) => {
  res.json({ success: true });
});

module.exports.router = router;