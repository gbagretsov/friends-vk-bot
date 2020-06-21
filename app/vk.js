require('dotenv').config();

const axios = require('axios');
const needle = require('needle');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

const accessToken = process.env.VK_ACCESS_TOKEN;
const peerID = process.env.VK_PEER_ID;
const personalAccessToken = process.env.VK_PERSONAL_ACCESS_TOKEN;
const personalPeerID = process.env.VK_PERSONAL_PEER_ID;
const apiUrl = 'https://api.vk.com/method';
const apiVersion = '5.110';

const delayPromise = function(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

module.exports.sendMessage = async function(message, delay) {
  const setTypingStatusIfNeeded = async function() {
    if (delay) {
      await axios.get(`${apiUrl}/messages.setActivity?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&type=typing`);
      return await delayPromise(delay);
    }
  };

  await setTypingStatusIfNeeded();
  try {
    const randomId = Date.now();
    console.log(`Random message ID: ${randomId}`);
    const response = await axios.get(`${apiUrl}/messages.send?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&message=${encodeURIComponent(message)}&random_id=${randomId}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return true;
  } catch (error) {
    console.error(`Error in sendMessage(): ${error.message}`);
    return false;
  }
};

module.exports.sendSticker = async function(stickerId) {
  try {
    const randomId = Date.now();
    console.log(`Random message ID: ${randomId}`);
    const response = await axios.get(`${apiUrl}/messages.send?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&sticker_id=${stickerId}&random_id=${randomId}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return true;
  } catch (error) {
    console.log(`Error in sendSticker(): ${error.message}`);
    return false;
  }
};

/**
 * @deprecated use getUserInfo
 */
module.exports.getUserName = async function(uid) {
  try {
    const response = await axios.get(`${apiUrl}/users.get?v=${apiVersion}&access_token=${accessToken}&user_ids=${uid}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return response.data.response[0].first_name;
  } catch (error) {
    console.log(`Error in getUserName(): ${error.message}`);
    return false;
  }
};

module.exports.getUserInfo = async function(uid) {
  const fields = 'sex,first_name_gen,first_name_dat,first_name_acc,first_name_ins,first_name_abl';
  try {
    const response = await axios.get(`${apiUrl}/users.get?v=${apiVersion}&access_token=${accessToken}&user_ids=${uid}&fields=${fields}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return response.data.response[0];
  } catch (error) {
    console.log(`Error in getUserInfo(): ${error.message}`);
    return false;
  }
};

module.exports.sendPhoto = async function(pathToPhoto) {
  try {
    // Получаем адрес сервера для загрузки фото
    const uploadUrlResponse = await axios.get(`${apiUrl}/photos.getMessagesUploadServer?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}`);
    
    // Загружаем фотографию
    const uploadUrl = uploadUrlResponse.data.response.upload_url;
    const buffer = await readFile(pathToPhoto);

    const data = {
      file: {
        buffer: buffer,
        filename: path.parse(pathToPhoto).base,
        content_type: 'image/jpeg',
      }
    };

    const photoInfoResponse = await needle('post', uploadUrl, data, { multipart: true });

    // Сохраняем фотографию
    const { server, photo, hash } = JSON.parse(photoInfoResponse.body);
    const savedPhotoInfoResponse = await axios.get(`${apiUrl}/photos.saveMessagesPhoto?v=${apiVersion}&photo=${photo}&server=${server}&hash=${hash}&access_token=${accessToken}`);

    // Прикрепляем фотографию
    const photoInfo = savedPhotoInfoResponse.data.response[0];
    const ownerID = photoInfo.owner_id;
    const mediaID = photoInfo.id;
    const attachment = `photo${ownerID}_${mediaID}`;
    const randomId = Date.now();
    console.log(`Random message ID: ${randomId}`);
    return await axios.get(`${apiUrl}/messages.send?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&attachment=${attachment}&random_id=${randomId}`);
  } catch (error) {
    console.log(`Error in sendPhoto(): ${error.message}`);
  }

};

module.exports.getPolls = async function(polls) {
  const pollIds = polls.map(poll => poll.id).join(',');
  const ownerIds = polls.map(poll => poll.ownerId).join(',');
  try {
    const response = await axios.get(`${apiUrl}/execute.getPolls?v=${apiVersion}&access_token=${personalAccessToken}&poll_ids=${pollIds}&owner_ids=${ownerIds}&peer_id=${personalPeerID}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    if (response.data.execute_errors) {
      throw new Error(response.data.execute_errors[0].error_msg);
    }
    return response.data.response;
  } catch (error) {
    console.log(`Error in getPolls(): ${error.message}`);
    return false;
  }
};

module.exports.getConversationMembers = async function() {
  try {
    const response = await axios.get(`${apiUrl}/messages.getConversationMembers?v=${apiVersion}&access_token=${accessToken}&peer_id=${peerID}&fields=first_name_gen,screen_name,sex`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return response.data.response.profiles;
  } catch (error) {
    console.log(`Error in getConversationMembers(): ${error.message}`);
    return false;
  }
};
