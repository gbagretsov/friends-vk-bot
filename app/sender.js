require('dotenv').config();

const axios = require('axios');
const accessToken = process.env.ACCESS_TOKEN;
const peerID = process.env.PEER_ID;
const apiUrl = `https://api.vk.com/method/messages.send?v=5.85&access_token=${accessToken}&peer_id=${peerID}`;

var errorHandler = function (error) {
  if (error.response) {
    return error.response.data;
  } else if (error.request) {
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