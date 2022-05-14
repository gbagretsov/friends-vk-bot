import {config} from 'dotenv';
import needle from 'needle';
import wav from 'mp3-to-wav/libs/wav';
import mp3Decode from 'mp3-to-wav/libs/decoder-mp3';
import vk from '../vk/vk';
import {VkMessage, VkMessageAudioMessageAttachment} from '../vk/model/VkMessage';
import {AudioTranscript} from './model/AudioTranscript';

config();

async function getAudioAttachmentTranscript(audioMessageAttachment: VkMessageAudioMessageAttachment): Promise<AudioTranscript | null> {

  const mp3Buffer = (await needle('get', audioMessageAttachment.audio_message.link_mp3)).body;

  const mp3DecodedBuffer = await mp3Decode(mp3Buffer);
  const channelData = [];
  for (let i = 0; i < mp3DecodedBuffer.numberOfChannels; i++) {
    channelData[i] = mp3DecodedBuffer.getChannelData(i);
  }

  const wavBuffer = wav.encode(channelData, {
    sampleRate: mp3DecodedBuffer.sampleRate,
    float: false,
  });

  const url = `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_KEY}`;
  const base64Audio = Buffer.from(wavBuffer).toString('base64');
  const data = {
    config: {
      languageCode: 'ru-RU',
      profanityFilter: true,
    },
    audio: {
      content: base64Audio,
    },
  };
  const recognizedText = await needle('post', url, data, { json: true });

  return recognizedText.body.results?.[0]?.alternatives[0] || null;
}

async function sendResult(result: AudioTranscript, uid: number): Promise<void> {
  const user = await vk.getUserInfo(uid);
  if (!user) {
    return;
  }

  let { transcript, confidence } = result;
  transcript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
  confidence = Math.round(confidence * 100);

  const pastTenseEnding = user.sex === 1 ? 'а' : '';

  const messages = [
    `С вероятностью ${ confidence }% ${ user.first_name } сказал${ pastTenseEnding }: \n "${ transcript }"`,
    `Вот текстовая версия сообщения ${ user.first_name_gen }: \n "${ transcript }" \n Точность распознавания: ${ confidence }%`,
    `"${ transcript }" \n Именно это сказал${ pastTenseEnding } ${ user.first_name } \n Я уверен в своём решении на ${ confidence }%`,
    `${ user.first_name }, у тебя очень красивый голос! 😊 А фразу "${ transcript }" с вероятностью ${ confidence }% будут цитировать наши потомки`,
  ];

  await vk.sendMessage(messages[Math.floor(Math.random() * messages.length)]);
}

export default async function (message: VkMessage) {
  if (vk.isAudioMessage(message)) {
    const audioAttachment = message.attachments[0] as VkMessageAudioMessageAttachment;
    const audioAttachmentTranscript = await getAudioAttachmentTranscript(audioAttachment);
    if (audioAttachmentTranscript) {
      await sendResult(audioAttachmentTranscript, message.from_id);
    } else {
      console.log('Text not recognized');
    }
    return true;
  }
  return false;
}
