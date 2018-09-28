const express = require('express')
var app = express()
const path = require('path')
const PORT = process.env.PORT || 5000

const { Client } = require('pg');

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))

require('./app/receiver')(app)

app.get('/actors', (req, res) => {

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: !process.env.DATABASE_URL.includes('localhost'), // На localhost без SSL
  });
  client.connect();

  client.query('SELECT * FROM friends_vk_bot.actors;', (err, r) => {
    if (err) {
      client.end();
      res.send(err);
      return;
    }
    let actors = r.rows.reduce((sum, cur) => sum += JSON.stringify(cur) + '<br/>', '');
    for (let row of r.rows) {
      console.log(JSON.stringify(row));
    }
    client.end();
    res.send(actors);
  });
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
