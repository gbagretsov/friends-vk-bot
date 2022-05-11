import needle from 'needle';
import {config} from 'dotenv';
import {timeout} from '../util';
import {
  isVkErrorResponse,
  isVkExecuteErrorResponse,
  VkErrorResponse,
  VkExecuteErrorsResponse,
  VkSuccessResponse
} from './model/VkResponse';
import {VkUser} from './model/VkUser';
import {VkConversation} from './model/VkConversation';
import {VkPoll} from './model/VkPoll';
import {VkMessage, VkMessageStickerAttachment, VkMessageAttachmentType} from './model/VkMessage';

config();

const accessToken = process.env.VK_ACCESS_TOKEN;
const peerID = process.env.VK_PEER_ID;
const personalAccessToken = process.env.VK_PERSONAL_ACCESS_TOKEN;
const personalPeerID = process.env.VK_PERSONAL_PEER_ID;
const groupID = process.env.VK_GROUP_ID;
const apiUrl = 'https://api.vk.com/method';
const apiVersion = '5.110';

async function sendMessage(message: string, delay?: number): Promise<boolean> {
  const setTypingStatusIfNeeded = async function() {
    if (delay) {
      await needle('get', `${apiUrl}/messages.setActivity?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&type=typing`);
      return await timeout(delay);
    }
  };

  await setTypingStatusIfNeeded();
  const randomId = Date.now();
  console.log(`Random message ID: ${randomId}`);
  const response = await needle('get', `${apiUrl}/messages.send?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&message=${encodeURIComponent(message)}&random_id=${randomId}`);
  const vkResponse = response.body as VkSuccessResponse<number> | VkErrorResponse;
  if (isVkErrorResponse(vkResponse)) {
    console.error(`Error in sendMessage(): ${vkResponse.error.error_msg}`);
    return false;
  }
  return true;
}

async function sendSticker(stickerId: number | string): Promise<boolean> {
  const randomId = Date.now();
  console.log(`Random message ID: ${randomId}`);
  const response = await needle('get', `${apiUrl}/messages.send?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&sticker_id=${stickerId}&random_id=${randomId}`);
  const vkResponse = response.body as VkSuccessResponse<number> | VkErrorResponse;
  if (isVkErrorResponse(vkResponse)) {
    console.error(`Error in sendSticker(): ${vkResponse.error.error_msg}`);
    return false;
  }
  return true;
}

/**
 * @deprecated use getUserInfo
 */
async function getUserName(uid: number): Promise<string | null> {
  const response = await needle('get', `${apiUrl}/users.get?v=${apiVersion}&access_token=${accessToken}&user_ids=${uid}`);
  const vkResponse = response.body as VkSuccessResponse<VkUser[]> | VkErrorResponse;
  if (isVkErrorResponse(vkResponse)) {
    console.log(`Error in getUserName(): ${vkResponse.error.error_msg}`);
    return null;
  }
  return vkResponse.response[0].first_name;
}

// TODO: remove redundant export
export async function getUserInfo(uid: number): Promise<VkUser | null> {
  const fields = 'sex,first_name_gen,first_name_dat,first_name_acc,first_name_ins,first_name_abl,photo_max_orig';
  const response = await needle('get', `${apiUrl}/users.get?v=${apiVersion}&access_token=${accessToken}&user_ids=${uid}&fields=${fields}`);
  const vkResponse = response.body as VkSuccessResponse<VkUser[]> | VkErrorResponse;
  if (isVkErrorResponse(vkResponse)) {
    console.error(`Error in getUserInfo(): ${vkResponse.error.error_msg}`);
    return null;
  }
  return vkResponse.response[0];
}

async function sendPhotoToChat(photoBuffer: Buffer): Promise<void> {
  // Получаем адрес сервера для загрузки фото
  const uploadUrlResponse =
    await needle('get', `${apiUrl}/photos.getMessagesUploadServer?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}`);

  // Загружаем фотографию
  const uploadUrl = uploadUrlResponse.body.response.upload_url;
  const data = {
    file: {
      buffer: photoBuffer,
      filename: 'filename.jpg',
      content_type: 'image/jpeg',
    }
  };

  const photoInfoResponse = await needle('post', uploadUrl, data, { multipart: true });

  // Сохраняем фотографию
  const { server, photo, hash } = JSON.parse(photoInfoResponse.body);
  const savedPhotoInfoResponse =
    await needle('get', `${apiUrl}/photos.saveMessagesPhoto?v=${apiVersion}&photo=${photo}&server=${server}&hash=${hash}&access_token=${accessToken}`);

  // Прикрепляем фотографию
  const photoInfo = savedPhotoInfoResponse.body.response[0];
  const ownerID = photoInfo.owner_id;
  const mediaID = photoInfo.id;
  const attachment = `photo${ownerID}_${mediaID}`;
  const randomId = Date.now();
  console.log(`Random message ID: ${randomId}`);
  await needle('get', `${apiUrl}/messages.send?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&attachment=${attachment}&random_id=${randomId}`);
}

async function addPhotoToAlbum(photoBuffer: Buffer, albumId: string): Promise<void> {
  // Получаем адрес сервера для загрузки фото
  const uploadUrlResponse = await needle('get', `${apiUrl}/photos.getUploadServer?v=${apiVersion}&access_token=${personalAccessToken}&group_id=${groupID}&album_id=${albumId}`);

  // Загружаем фотографию
  const uploadUrl = uploadUrlResponse.body.response.upload_url;
  const data = {
    file1: {
      buffer: photoBuffer,
      filename: 'filename.jpg',
      content_type: 'image/jpeg',
    }
  };

  const photoInfoResponse = await needle('post', uploadUrl, data, { multipart: true });

  // Сохраняем фотографию
  const { server, photos_list, hash } = JSON.parse(photoInfoResponse.body);
  await needle('get', `${apiUrl}/photos.save?v=${apiVersion}&album_id=${albumId}&group_id=${groupID}&photos_list=${photos_list}&server=${server}&hash=${hash}&access_token=${personalAccessToken}`);

}

async function getPolls(polls: { id: string, ownerId: string }[]): Promise<{ poll_info: VkPoll; voters: number[] }[] | null> {
  const pollIds = polls.map(poll => poll.id).join(',');
  const ownerIds = polls.map(poll => poll.ownerId).join(',');
  const response = await needle('get', `${apiUrl}/execute.getPolls?v=${apiVersion}&access_token=${personalAccessToken}&poll_ids=${pollIds}&owner_ids=${ownerIds}&peer_id=${personalPeerID}`);
  const vkResponse = response.body as VkSuccessResponse<{ poll_info: VkPoll; voters: number[] }[]> | VkErrorResponse | VkExecuteErrorsResponse;
  if (isVkErrorResponse(vkResponse)) {
    console.error(`Error in getPolls(): ${vkResponse.error.error_msg}`);
    return null;
  }
  if (isVkExecuteErrorResponse(vkResponse)) {
    console.error(`Error in getPolls(): ${vkResponse.execute_errors[0].error_msg}`);
    return null;
  }
  return vkResponse.response;
}

async function getConversationMembers(): Promise<VkUser[] | null> {
  const response = await needle('get', `${apiUrl}/messages.getConversationMembers?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&fields=first_name_gen,screen_name,sex`);
  const vkResponse = response.body as VkSuccessResponse<VkConversation> | VkErrorResponse;
  if (isVkErrorResponse(vkResponse)) {
    console.error(`Error in getConversationMembers(): ${vkResponse.error.error_msg}`);
    return null;
  }
  return vkResponse.response.profiles;
}

async function sendYouTubeVideo(youTubeVideoId: string): Promise<boolean> {
  const saveVideoResponse = await needle('get', `${apiUrl}/video.save?v=${apiVersion}&access_token=${personalAccessToken}&is_private=1&wallpost=0&link=https://www.youtube.com/watch?v=${youTubeVideoId}`);
  if (isVkErrorResponse(saveVideoResponse.body)) {
    console.error(`video.save: ${saveVideoResponse.body.error.error_msg}`);
    return false;
  }
  const uploadUrlResponse = await needle('get', saveVideoResponse.body.response.upload_url);
  if (isVkErrorResponse(uploadUrlResponse.body)) {
    console.error(`upload_url: ${uploadUrlResponse.body.error.error_msg}`);
    return false;
  }
  const randomId = Date.now();
  const attachment = `video${saveVideoResponse.body.response.owner_id}_${saveVideoResponse.body.response.video_id}_${saveVideoResponse.body.response.access_key}`;
  const sendMessageResponse = await needle('get', `${apiUrl}/messages.send?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&attachment=${attachment}&random_id=${randomId}`);
  if (isVkErrorResponse(sendMessageResponse.body)) {
    console.error(`messages.send: ${sendMessageResponse.body.error.error_msg}`);
    return false;
  }
  return true;
}

function getStickerId(message: VkMessage): number | null {
  if (isStickerMessage(message)) {
    return (message.attachments[0] as VkMessageStickerAttachment).sticker.sticker_id;
  } else {
    return null;
  }
}

// TODO: remove redundant export
export function isStickerMessage(message: VkMessage): boolean {
  return message.attachments[0]?.type === VkMessageAttachmentType.STICKER;
}

export function isAudioMessage(message: VkMessage): boolean {
  return message.attachments[0]?.type === VkMessageAttachmentType.AUDIO_MESSAGE;
}

export function isRepost(message: VkMessage): boolean {
  return message.attachments[0]?.type === VkMessageAttachmentType.WALL;
}

export function isPoll(message: VkMessage): boolean {
  return message.attachments[0]?.type === VkMessageAttachmentType.POLL;
}

export default {
  sendMessage,
  sendSticker,
  getUserName,
  getUserInfo,
  sendPhotoToChat,
  addPhotoToAlbum,
  getPolls,
  getConversationMembers,
  sendYouTubeVideo,
  getStickerId,
  isStickerMessage,
  isAudioMessage,
  isRepost,
  isPoll,
};
