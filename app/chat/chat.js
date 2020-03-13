const vk = require('../vk');
require('dotenv').config();

module.exports = function(message) {  
  let text = message.text.toLowerCase();

  if (text.startsWith('бот,') || text.includes(`club${process.env.VK_GROUP_ID}`)) {
    let uid = message.from_id;
    vk.getUserName(uid)
      .then(function (response) {
        vk.sendMessage(`Привет, ${ response }!`, 5000);
      });
    return true;
  }

  return false;
};
