const axios = require('axios');
const accessToken = process.env.ACCESS_TOKEN;

module.exports = function(message) {  
  let text = message.text.toLowerCase();

  if (text.startsWith('бот,') || text.includes('club171869330')) {
    let uid = message.from_id;
    axios.get(`https://api.vk.com/method/users.get?v=5.85&access_token=${accessToken}&user_ids=${uid}`)
      .then(function (response) {
        require('../sender').sendMessage(`Привет, ${ response.data.response[0].first_name }!`);
      });
    return true;
  }

  return false;
}