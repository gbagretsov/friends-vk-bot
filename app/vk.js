require('dotenv').config();

const axios = require('axios');
const needle = require('needle');
const fs = require('fs');
const path = require('path');

const accessToken = process.env.ACCESS_TOKEN;
const peerID = process.env.PEER_ID;
const apiUrl = `https://api.vk.com/method/messages.send?v=5.85&access_token=${accessToken}&peer_id=${peerID}`;

var errorHandler = function (error) {
  if (error.response) {
    console.log(error.response.data);
    return error.response.data;
  } else if (error.request) {
    console.log('Sender error: ' + error.message);
    return 'Sender error: ' + error.message;
  }
};

module.exports.sendMessage = function(message) {
  return axios.get(`${apiUrl}&message=${encodeURIComponent(message)}`)
    .then(function (response) {
      return response.data;
    })
    .catch(errorHandler);
};

module.exports.sendSticker = function(stickerId) {
  return axios.get(`${apiUrl}&sticker_id=${stickerId}`)
    .then(function (response) {
      return response.data;
    })
    .catch(errorHandler);
};

module.exports.getUserName = function(uid) {
  return axios.get(`https://api.vk.com/method/users.get?v=5.85&access_token=${accessToken}&user_ids=${uid}`)
    .then(function (response) {
      return response.data.response[0].first_name;
    })
    .catch(errorHandler);
};

module.exports.sendPhoto = function(pathToPhoto) {
  // Получаем адрес сервера для загрузки фото
  return axios.get(`https://api.vk.com/method/photos.getMessagesUploadServer?v=5.85&access_token=${accessToken}&peer_id=${peerID}`)
    .then(response => {
      // Загружаем фотографию
      let uploadUrl = response.data.response.upload_url;
      let buffer = fs.readFileSync(pathToPhoto);

      let data = {
        file: {
          buffer: buffer,
          filename: path.parse(pathToPhoto).base,
          content_type: 'image/jpeg',
        }
      }

      return needle('post', uploadUrl, data, { multipart: true }); 
    })
    .then(response => {
      // Сохраняем фотографию
      let data = JSON.parse(response.body);
      let server = data.server;
      let photo = data.photo;
      let hash = data.hash;
      return axios.get(`https://api.vk.com/method/photos.saveMessagesPhoto?v=5.85&photo=${photo}&server=${server}&hash=${hash}&access_token=${accessToken}`);
    })
    .then(response => {
      // Прикрепляем фотографию
      let photoInfo = response.data.response[0];
      let ownerID = photoInfo.owner_id;
      let mediaID = photoInfo.id;
      let attachment = `photo${ownerID}_${mediaID}`;
      return axios.get(`${apiUrl}&attachment=${attachment}`);
    })
    .catch(errorHandler);
};