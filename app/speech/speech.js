require('dotenv').config();
const needle = require('needle');
const wav = require('mp3-to-wav/libs/wav');
const fs = require('fs');
const path = require('path');
const Mp32Wav = require('mp3-to-wav');
Mp32Wav.prototype.saveForWav = function fixedSaveForWav(buffer, savePath, filename, sampleRate, channels, float = true) {

  const fileFullName = filename + '.wav';
  const fileFullPath = path.join(savePath, fileFullName);

  try {
    const wavData = wav.encode(buffer, {sampleRate: sampleRate, float: float, channels: channels});
    fs.writeFileSync(fileFullPath, wavData);
    return fileFullPath;
  } catch (err) {
    throw new Error(`saveForWav err: ${err.message}`);
  }
};
const vk = require('../vk');

let handleAudioMessage = async (audioMessage) => {
  // Получаем аудиозапись
  let rawAudio = await needle('get', audioMessage.link_mp3);
  rawAudio = rawAudio.body;

  // Конвертируем в нужный формат
  fs.writeFileSync(__dirname + '/audio.mp3', rawAudio);
  const mp32Wav = new Mp32Wav(__dirname + '/audio.mp3');
  const mp3DecodeRes = await mp32Wav.decodeMp3(__dirname + '/audio.mp3');
  mp32Wav.saveForWav(mp3DecodeRes.data, __dirname, 'audio', mp3DecodeRes.sampleRate, 1, false);

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
  if (vk.isAudioMessage(message)) {
    let audioMessage = message.attachments[0].audio_message;
    handleAudioMessage(audioMessage).then(result => sendResult(result, message.from_id));
    return true;
  }
  return false;
};
