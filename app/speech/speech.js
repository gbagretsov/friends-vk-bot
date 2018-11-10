require('dotenv').config();
const needle = require('needle');
const Audio = require('audio');
const fs = require('fs');
const vk = require('../vk');

function savePromisified(audio, fileName) {
  return new Promise(resolve => {
    audio.save(fileName, resolve);
  });
}

let handleAudioMessage = async (audioMessage) => {
  // Получаем аудиозапись
  let rawAudio = await needle('get', audioMessage.link_mp3);
  rawAudio = rawAudio.body;
  
  // TODO: сделать без сохранения на диск

  // Конвертируем в нужный формат
  fs.writeFileSync(__dirname + '/audio.mp3', rawAudio);
  Audio.cache = {};
  rawAudio = await Audio.load('./audio.mp3');
  await savePromisified(rawAudio, 'audio.wav');
  rawAudio = fs.readFileSync(__dirname + '/audio.wav');

  // Загружаем аудио на сервер Google
  let url = `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_KEY}`;
  let base64Audio = Buffer.from(rawAudio).toString('base64');
  let data = {
    config: {
      languageCode: 'ru-RU',
      profanityFilter: true,
    },
    audio: {
      content: base64Audio,
    },
  };
  let recognizedText = await needle('post', url, data, { json: true });

  try {
    return recognizedText.body.results[0].alternatives[0];
  } catch (error) {
    return false;
  }
};

let sendResult = async (result) => {
  if (!result) {
    console.log('text not recognized');
    return;
  }

  // TODO: вписать имя и пол отправителя
  vk.sendMessage(`Результат: ${result.transcript}, вероятность: ${result.confidence}`);
};

module.exports = function(message) {
  if (message.attachments && message.attachments[0] && message.attachments[0].type === 'audio_message') {
    let audioMessage = message.attachments[0].audio_message;
    handleAudioMessage(audioMessage).then(sendResult);
    return true;
  }
  return false;
};