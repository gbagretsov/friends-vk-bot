const express = require('express');
const router = express.Router();
require('dotenv').config();

function checkToken(req, res, next) {
  let receivedToken = req.body.token || req.query.token;
  let actualToken = process.env.VK_ACCESS_TOKEN;
  if (receivedToken === actualToken) {
    req.body.demo = false;
    next();
  } else if (receivedToken && receivedToken.toUpperCase() === 'DEMO') {
    req.body.demo = true;
    next();
  } else {
    res.json({ error: 'token' });
  }
}

router.use(checkToken);

router.use('/words', require('./words').router);
router.use('/ads', require('./ads').router);
router.use('/customReactions', require('./custom-reactions').router);

router.post('/', (req, res) => {
  res.json({ success: true, demo: req.body.demo });
});

module.exports.router = router;
