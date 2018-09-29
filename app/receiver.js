const bodyParser = require('body-parser');
require('dotenv').config();

const peerID = process.env.PEER_ID;

module.exports = function(app){

  app.use(bodyParser.json());

  app.post('/receive', (req, res) => {
    
    // Подтверждение адреса
    if (req.body.type === 'confirmation' && req.body.group_id === 171869330) {
      res.send('06e56df0');
      return;
    } 
    
    // Приём сообщений
    if (req.body.type === 'message_new') {
      let message = req.body.object;
      
      if (peerID == message.peer_id) {
        console.log(message.text);

        // Если сообщение не распознано модулем, передаём его дальше по цепочке.
        // Таким образом, повляется возможность обрабатывать различные сценарии.

        const handleByGameModule = require('./game/game');
        const handleByChatModule = require('./chat/chat');

        handleByGameModule(message)
          .then(handled => {
            return handled || handleByChatModule(message);
          })
          .then(handled => {
            if (!handled) {
              console.log('I didn\'t understand this message :(');
            }
          });

      } else {
        console.log('This message is not for me');
      };

      res.send('ok');
      return;
    }

    res.status(404).end();
  });
}