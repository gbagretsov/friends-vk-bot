const bodyParser = require('body-parser');
require('dotenv').config();

const axios = require('axios');
const accessToken = process.env.ACCESS_TOKEN;
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
      if (peerID == req.body.object.peer_id) {
        console.log(req.body.object);
        let msg = req.body.object.text;

        // TODO: логика игры
        if (msg.startsWith('Бот,') || msg.includes('club171869330')) {
          let uid = req.body.object.from_id;
          axios.get(`https://api.vk.com/method/users.get?v=5.85&access_token=${accessToken}&user_ids=${uid}`)
            .then(function (response) {
              require('./sender').sendMessage(`Привет, ${ response.data.response[0].first_name }!`);
            });
          } else {
            console.log('I didn\'t understand this message :(');
          }
      } else {
        console.log('This message is not for me');
      };
      res.send('ok');
      return;
    }

    res.status(404).end();
  });
}