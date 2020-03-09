const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

require('./app/receiver')(app);

app.use('/api', require('./app/api/api').router);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
