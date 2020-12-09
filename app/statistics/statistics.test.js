const textMessage = { text: 'Hello', from_id: 1, conversation_message_id: 1 };
const stickerMessage = {
  attachments: [
    {
      type: 'sticker',
      sticker: { sticker_id: 1 }
    }],
  from_id: 1,
  conversation_message_id: 1
};
const audioMessage = {
  attachments: [
    {
      type: 'audio_message',
      audio_message: { link_mp3: 'link_mp3' }
    }],
  from_id: 1,
  conversation_message_id: 1
};
const repostMessage = {
  attachments: [
    {
      type: 'wall',
      wall: { id: 1 }
    }],
  from_id: 1,
  conversation_message_id: 1
};

beforeAll(() => {

});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe('Collect statistics', () => {
  // TODO
  // When bot receives a message and message has not been handled before, bot gathers info from this message
  // When bot receives a message and message has been handled before, bot does not gather info from this message
  // During gathering of info from message bot increases total messages counter if needed
  // During gathering of info from message bot increases voice messages counter if needed
  // During gathering of info from message bot increases stickers counter if needed
  // During gathering of info from message bot increases reposts counter if needed
  // During gathering of info from message bot increases messages counter for the current sender

  test('Bot always passes message further to following handlers', () => {
    const handleMessage = require('./statistics').handleMessage;
    expect(handleMessage(textMessage)).toBe(false);
    expect(handleMessage(audioMessage)).toBe(false);
    expect(handleMessage(stickerMessage)).toBe(false);
    expect(handleMessage(repostMessage)).toBe(false);
  });
});

describe('Get statistics', () => {
  // Bot correctly returns data for total amount of messages
  // Bot correctly returns data for amount of audio messages
  // Bot correctly returns data for amount of sticker messages
  // Bot correctly returns data for amount of repost messages
  // Bot correctly returns data for most active user (case when there is one most active user)
  // Bot correctly returns data for most active user (case when there are two most active users)
  // Bot correctly returns data for most active user (case when there are three most active users)
  // Bot correctly returns data for previous month
  // Bot does not return data for previous month if it is not present
});

describe('Reset statistics', () => {
  // Bot correctly resets statistics for current month
  // Bot correctly sets statistics for previous month
});
