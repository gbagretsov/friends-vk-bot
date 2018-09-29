const sender = require('../sender');

module.exports = function(message) {  
  let text = message.text.toLowerCase();

  // TODO: логика игры, проверка состояния

  let botMentioned = text.startsWith('бот,') || text.includes('club171869330');
  let gameRequested = 
    text.includes(' игр') ||
    text.includes('поигра') || 
    text.includes('сыгра');

  if (botMentioned && gameRequested) {
    sender.sendMessage(`Игра начинается!`);
    return true;
  }

  return false;
}