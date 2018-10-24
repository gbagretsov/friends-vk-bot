const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  // TODO: реклама
  res.json({ ads: 'ads' });
});

module.exports.router = router;