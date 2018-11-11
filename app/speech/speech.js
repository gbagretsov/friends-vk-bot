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

let sendResult = async (result, uid) => {
  if (!result) {
    console.log('text not recognized');
    return;
  }

  let user = await vk.getUserInfo(uid);
  let { transcript, confidence } = result;
  transcript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
  confidence = Math.round(confidence * 100);

  let pastTenseEnding = user.sex === 1 ? 'а' : '';

  // TODO: добавить фразы
  let messages = [
    `С вероятностью ${ confidence }% ${ user.first_name } сказал${ pastTenseEnding }: \n "${ transcript }"`,
    `Вот текстовая версия сообщения ${ user.first_name_gen }: \n "${ transcript }" \n Точность распознавания: ${ confidence }%`,
    `"${ transcript }" \n Именно это сказал${ pastTenseEnding } ${ user.first_name } \n Я уверен в своём решении на ${ confidence }%`,
    `${ user.first_name }, у тебя очень красивый голос! 😊 А фразу "${ transcript }" с вероятностью ${ confidence }% будут цитировать наши потомки`,
  ];

  vk.sendMessage(messages[Math.floor(Math.random() * messages.length)]);
};

module.exports = function(message) {
  if (message.attachments && message.attachments[0] && message.attachments[0].type === 'audio_message') {
    let audioMessage = message.attachments[0].audio_message;
    handleAudioMessage(audioMessage).then(result => sendResult(result, message.from_id));
    return true;
  }
  return false;
};