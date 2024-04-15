import {VkMessage, VkMessageAttachmentType} from '../vk/model/VkMessage';
import {getLargestPhotoSize} from '../util';
import {createWorker} from 'tesseract.js';
import {config} from 'dotenv';

config();

async function isMeme(message: VkMessage): Promise<boolean> {
  let imageUrl = null;
  const attachment = message.attachments[0];
  if (attachment?.type === VkMessageAttachmentType.WALL) {
    const wallAttachment = attachment.wall.attachments[0];
    if (wallAttachment?.type === VkMessageAttachmentType.PHOTO) {
      imageUrl = getLargestPhotoSize(wallAttachment.photo).url;
    }
  }
  if (attachment?.type === VkMessageAttachmentType.PHOTO) {
    imageUrl = getLargestPhotoSize(attachment.photo).url;
  }
  if (!imageUrl) {
    return false;
  }
  const worker = await createWorker('rus');
  const recognitionResult = await worker.recognize(imageUrl);
  await worker.terminate();
  const confidence = recognitionResult.data.confidence;
  const isMeme = confidence > process.env.MEMES_RECOGNITION_CONFIDENCE;
  console.log(`${imageUrl} - text recognition confidence is ${confidence}, is meme = ${isMeme}`);
  return isMeme;
}

async function handleMessage(message: VkMessage): Promise<false> {
  if (await isMeme(message)) {
    console.log('Meme is found');
  }
  return false;
}

export default handleMessage;