require('dotenv').config();

const peerID = process.env.VK_PEER_ID.toString();

module.exports = function(app){

  app.post('/receive', async (req, res) => {
    
    // Подтверждение адреса
    if (req.body.type === 'confirmation' && req.body.group_id.toString() === process.env.VK_GROUP_ID.toString()) {
      res.send(process.env.VK_CONFIRMATION_RESPONSE);
      return;
    } 
    
    // Приём сообщений
    if (req.body.type === 'message_new') {
      res.send('ok');
      
      let message = req.body.object;
      
      if (peerID === message.peer_id.toString()) {
        console.log(`Got message: ${message.text}`);

        // Если сообщение не распознано модулем, передаём его дальше по цепочке.
        // Таким образом, повляется возможность обрабатывать различные сценарии.

        const handleByGameModule = require('./game/game');
        const handleByChatModule = require('./chat/chat');
        const handleBySpeechModule = require('./speech/speech');
        const handleLookForPollInIncomingMessage = require('./polls-watch/polls-watch').handleLookForPollInIncomingMessage;

        let handled = 
          handleByGameModule(message) ||
          handleBySpeechModule(message) ||
          handleLookForPollInIncomingMessage(message) ||
          handleByChatModule(message);
          
        if (!handled) {
          console.log('I didn\'t understand this message :(');
        }

      } else {
        console.log('This message is not for me');
      }

      return;
    }

    res.status(404).end();
  });
};
