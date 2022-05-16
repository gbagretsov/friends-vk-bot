import vk from '../vk/vk';
import speech from './speech';
import * as testMessages from './test-resources/messages';
import * as googleSpeechResponses from './test-resources/google-speech-responses';
import {Sex, VkUser} from '../vk/model/VkUser';

const audioMessageBufferResponse = { body: new ArrayBuffer(1) };
const googleSpeechResponse: { body?: unknown } = { };

jest.spyOn(global.Math, 'random').mockReturnValue(0.1);

jest.mock('needle', () => (method: string, url: string) => {
  if (url.includes('mp3')) {
    return Promise.resolve(audioMessageBufferResponse);
  } else if (url.includes('google')) {
    return Promise.resolve(googleSpeechResponse);
  }
});

jest.mock('mp3-to-wav/libs/decoder-mp3', () => () => ({
  numberOfChannels: 1,
  getChannelData: () => new ArrayBuffer(1),
}));

jest.mock('mp3-to-wav/libs/wav', () => ({
  encode: () => new ArrayBuffer(1),
}));

const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);
const getUserInfoSpy = jest.spyOn(vk, 'getUserInfo').mockImplementation((userId: number) => {
  if (userId === 123) {
    return Promise.resolve({ first_name: 'Иван', sex: Sex.MALE } as VkUser);
  } else if (userId === 456) {
    return Promise.resolve({ first_name: 'Анна', sex: Sex.FEMALE } as VkUser);
  } else {
    throw new Error('Invalid user ID');
  }
});

describe('Speech', () => {
  test('When bot receives an audio message, it stops further handling of this message', async () => {
    setMocks();
    expect(await speech(testMessages.messageWithAudioAttachmentFromMaleUser)).toBe(true);
  });

  test('When bot receives an audio message and text is recognized, bot sends exactly one message in response', async () => {
    setMocks();
    await speech(testMessages.messageWithAudioAttachmentFromMaleUser);
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });

  test('When bot receives an audio message and text is recognized, bot sends a message with transcript and correctness value', async () => {
    setMocks();
    await speech(testMessages.messageWithAudioAttachmentFromMaleUser);
    const sentMessage = sendMessageSpy.mock.calls[0][0];
    expect(sentMessage).toMatch(/"Расшифровка записи"/);
    expect(sentMessage).toMatch(/95%/);
  });

  test('When bot receives an audio message and text is recognized, bot sends a message considering sender\'s name and sex', async () => {
    setMocks();
    await speech(testMessages.messageWithAudioAttachmentFromMaleUser);
    await speech(testMessages.messageWithAudioAttachmentFromFemaleUser);
    expect(sendMessageSpy.mock.calls[0][0]).toMatch(/Иван сказал:/);
    expect(sendMessageSpy.mock.calls[1][0]).toMatch(/Анна сказала:/);
    expect(getUserInfoSpy.mock.calls[0][0]).toBe(123);
    expect(getUserInfoSpy.mock.calls[1][0]).toBe(456);
  });

  test('When bot receives an audio message and text is not recognized, bot does not send any messages', async() => {
    setMocks({ textRecognized: false });
    await speech(testMessages.messageWithAudioAttachmentFromMaleUser);
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  test('When bot receives a common message, it does not stop further handling of this message', async () => {
    expect(await speech(testMessages.messageWithoutAudioAttachment)).toBe(false);
  });

  test('When bot receives a common message, it does not send any messages', async () => {
    setMocks();
    await speech(testMessages.messageWithoutAudioAttachment);
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });
});

function setMocks(options = { textRecognized: true }) {
  googleSpeechResponse.body = options.textRecognized ?
    googleSpeechResponses.speechRecognizedBody :
    googleSpeechResponses.speechNotRecognizedBody;
}
