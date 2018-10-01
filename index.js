const express = require('express')
var app = express()
const bodyParser = require('body-parser')
const path = require('path')
const PORT = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))

require('./app/receiver')(app)

app.use('/words', require('./app/game/admin').router);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
