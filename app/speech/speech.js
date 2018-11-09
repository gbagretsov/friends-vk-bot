module.exports = function(message) {
  if (message.attachments && message.attachments[0] && message.attachments[0].type === 'audio_message') {
    let audioMessage = message.attachments[0].audio_message;
    // TODO: обработка аудиосообщения
    console.log(audioMessage);
    return true;
  }
  return false;
};