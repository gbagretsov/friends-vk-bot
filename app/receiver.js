const bodyParser = require('body-parser');

module.exports = function(app){

  app.use(bodyParser.json());

  app.post('/receive', (req, res) => {
    
    // Подтверждение адреса
    if (req.body.type === 'confirmation' && req.body.group_id === 171869330) {
      res.send('06e56df0');
      return;
    } 
    
    // TODO: приём сообщений

    res.status(404).end();
  });
}