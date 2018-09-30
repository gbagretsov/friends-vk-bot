const express = require('express')
var app = express()
const path = require('path')
const PORT = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))

require('./app/receiver')(app)

app.get('/words', (req, res) => {

  const client = require('./app/db')();

  client.query('SELECT * FROM friends_vk_bot.words;')
    .then(r => {
      let words = r.rows.reduce((sum, cur) => sum += JSON.stringify(cur) + '<br/>', '');
      for (let row of r.rows) {
        console.log(JSON.stringify(row));
      }
      res.send(words);
    })
    .catch(error => {
      console.log(error);
      res.send(error);
    })
    .then(() => client.end());
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
