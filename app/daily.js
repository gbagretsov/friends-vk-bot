const sender = require('./sender');
const weather = require('./weather');
const util = require('util')

module.exports = function(app) {
  app.get('/daily', (req, res) => {

    let messages = [
      sender.sendMessage('Test 1'),
      sender.sendMessage('Test 2'),
      sender.sendMessage('Test 3'),
      sender.sendSticker(1),
    ];

    // TODO: правильно выстраивать очередь сообщений
    Promise.all(messages)
    .then(values => {
      res.send(
        values
        .map(v => util.inspect(v))
        .join('<br/>')
      );
    })
    .catch((error) => res.send(`Error: ${error}`));    
  })
};