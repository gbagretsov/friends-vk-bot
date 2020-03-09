const vk = require('../vk');

module.exports = function(message) {  
  let text = message.text.toLowerCase();

  if (text.startsWith('бот,') || text.includes('club171869330')) {
    let uid = message.from_id;
    vk.getUserName(uid)
      .then(function (response) {
        vk.sendMessage(`Привет, ${ response }!`, 5000);
      });
    return true;
  }

  return false;
};
