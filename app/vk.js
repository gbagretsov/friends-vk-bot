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

let delayPromise = function(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

module.exports.sendMessage = async function(message, delay) {
  let setTypingStatusIfNeeded = async function() {
    if (delay) {
      await axios.get(`${apiUrl}/messages.setActivity?v=5.85&access_token=${accessToken}&peer_id=${peerID}&type=typing`);
      return await delayPromise(delay);
    }
  };

  await setTypingStatusIfNeeded();
  try {
    let response = await axios.get(`${apiUrl}/messages.send?v=5.85&access_token=${accessToken}&peer_id=${peerID}&message=${encodeURIComponent(message)}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

module.exports.sendSticker = async function(stickerId) {
  try {
    let response = await axios.get(`${apiUrl}/messages.send?v=5.85&access_token=${accessToken}&peer_id=${peerID}&sticker_id=${stickerId}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

/**
 * @deprecated use getUserInfo
 */
module.exports.getUserName = async function(uid) {
  try {
    let response = await axios.get(`${apiUrl}/users.get?v=5.85&access_token=${accessToken}&user_ids=${uid}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return response.data.response[0].first_name;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

module.exports.getUserInfo = async function(uid) {
  let fields = 'sex,first_name_gen,first_name_dat,first_name_acc,first_name_ins,first_name_abl';
  try {
    let response = await axios.get(`${apiUrl}/users.get?v=5.85&access_token=${accessToken}&user_ids=${uid}&fields=${fields}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return response.data.response[0];
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

module.exports.sendPhoto = async function(pathToPhoto) {
  try {
    // Получаем адрес сервера для загрузки фото
    let uploadUrlResponse = await axios.get(`${apiUrl}/photos.getMessagesUploadServer?v=5.85&access_token=${accessToken}&peer_id=${peerID}`);
    
    // Загружаем фотографию
    let uploadUrl = uploadUrlResponse.data.response.upload_url;
    let buffer = await readFile(pathToPhoto);

    let data = {
      file: {
        buffer: buffer,
        filename: path.parse(pathToPhoto).base,
        content_type: 'image/jpeg',
      }
    };

    let photoInfoResponse = await needle('post', uploadUrl, data, { multipart: true });

    // Сохраняем фотографию
    let { server, photo, hash } = JSON.parse(photoInfoResponse.body);
    let savedPhotoInfoResponse = await axios.get(`${apiUrl}/photos.saveMessagesPhoto?v=5.85&photo=${photo}&server=${server}&hash=${hash}&access_token=${accessToken}`);

    // Прикрепляем фотографию
    let photoInfo = savedPhotoInfoResponse.data.response[0];
    let ownerID = photoInfo.owner_id;
    let mediaID = photoInfo.id;
    let attachment = `photo${ownerID}_${mediaID}`;
    return await axios.get(`${apiUrl}/messages.send?v=5.85&access_token=${accessToken}&peer_id=${peerID}&attachment=${attachment}`);
  } catch (error) {
    console.log(error.message);
  }

};

module.exports.getPolls = async function(polls) {
  const pollIds = polls.map(poll => poll.id).join(',');
  const ownerIds = polls.map(poll => poll.ownerId).join(',');
  try {
    let response = await axios.get(`${apiUrl}/execute.getPolls?v=5.85&access_token=${personalAccessToken}&poll_ids=${pollIds}&owner_ids=${ownerIds}&peer_id=${personalPeerID}`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    if (response.data.execute_errors) {
      throw new Error(response.data.execute_errors[0].error_msg);
    }
    return response.data.response;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

module.exports.getConversationMembers = async function() {
  try {
    let response = await axios.get(`${apiUrl}/messages.getConversationMembers?v=5.85&access_token=${accessToken}&peer_id=${peerID}&fields=first_name_gen,screen_name,sex`);
    if (response.data.error) {
      throw new Error(response.data.error.error_msg);
    }
    return response.data.response.profiles;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};
