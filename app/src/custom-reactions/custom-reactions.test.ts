import customReactions from './custom-reactions';
import db from '../db';
import vk from '../vk/vk';
import SpyInstance = jest.SpyInstance;
import {CustomReaction} from './model/CustomReaction';
import * as testReactions from './test-resources/reactions';
import * as testMessages from './test-resources/messages';
import {QueryResult} from 'pg';
import {VkMessageStickerAttachment} from '../vk/model/VkMessage';

jest.mock('../db');
jest.mock('needle', () => () => Promise.resolve({}));

const sendMessageSpy = jest.spyOn(vk, 'sendMessage').mockResolvedValue(true);
const sendPhotoToChatSpy = jest.spyOn(vk, 'sendPhotoToChat').mockResolvedValue();
const sendStickerSpy = jest.spyOn(vk, 'sendSticker').mockResolvedValue(true);
const sendYouTubeVideoSpy = jest.spyOn(vk, 'sendYouTubeVideo').mockResolvedValue(true);

let dbQuerySpy: SpyInstance;

describe('Custom reactions', () => {
  describe('Positive tests', () => {

    test('When bot receives a text message and finds appropriate rule, and random check is successful, ' +
      'bot sends a reaction stored in that rule', async () => {
      const reactions = testReactions.oneTextReaction;
      setMocks({ randomCheck: 0.001, reactions });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(dbQuerySpy.mock.calls[0][0]).toMatch(testMessages.messageWithAppropriatePhrase.text);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0]).toEqual(reactions[0].content);
    });

    test('When bot receives a text message and finds appropriate rule, ' +
      'and random check is successful for sum of base probability and additional probability, ' +
      'bot sends a reaction stored in that rule', async () => {
      const reactions = testReactions.oneTextReactionWithAdditionalProbability;
      setMocks({ randomCheck: 0.6, reactions });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(dbQuerySpy.mock.calls[0][0]).toMatch(testMessages.messageWithAppropriatePhrase.text);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0]).toEqual(reactions[0].content);
    });

    test('When bot receives a sticker and finds appropriate rule, and random check is successful, ' +
      'bot sends a reaction stored in that rule', async () => {
      const reactions = testReactions.oneTextReaction;
      setMocks({ randomCheck: 0.001, reactions });
      const message = testMessages.messageWithAppropriateSticker;
      const stickerId = (message.attachments[0] as VkMessageStickerAttachment).sticker.sticker_id.toString();
      await customReactions(message);
      await Promise.resolve();
      expect(dbQuerySpy.mock.calls[0][0]).toMatch(stickerId);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0]).toEqual(reactions[0].content);
    });

    test('When bot finds appropriate rule to react, and random check is successful, ' +
      'and there are more than one possible reaction, bot sends only one reaction', async () => {
      setMocks({ randomCheck: 0.001, reactions: testReactions.twoTextReactions });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy.mock.calls[0][0]).toMatch(/This is custom reaction/);
    });

    test('When bot finds appropriate rule to react, and random check is successful, ' +
      'bot stops further handling of incoming message', async () => {
      setMocks({ randomCheck: 0.001, reactions: testReactions.twoTextReactions });
      const result = await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(result).toBe(true);
    });

    test('When bot finds appropriate rule to react, and random check is successful, ' +
      'bot resets additional probability for that rule', async () => {
      setMocks({ randomCheck: 0.001, reactions: testReactions.oneTextReaction });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/additional_probability=0/);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/id=1/);
    });

  });

  describe('Negative tests', () => {

    test('When bot finds appropriate rule to react, and random check is not successful, ' +
      'bot does not send anything', async () => {
      setMocks({ randomCheck: 0.99, reactions: testReactions.oneTextReaction });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(dbQuerySpy.mock.calls[0][0]).toMatch(testMessages.messageWithAppropriatePhrase.text);
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    test('When bot finds appropriate rule to react, and random check is not successful, ' +
      'bot increases additional probability for that rule', async () => {
      setMocks({ randomCheck: 0.99, reactions: testReactions.oneTextReaction });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/additional_probability=5/);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/id=1/);
    });

    test('When bot finds appropriate rule to react, and random check is not successful, and rule has non-zero additional probability' +
      'bot increases additional probability for that rule', async () => {
      setMocks({ randomCheck: 0.99, reactions: testReactions.oneTextReactionWithAdditionalProbability });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/additional_probability=25/);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/id=1/);
    });

    test('When bot finds appropriate rule to react, and random check is not successful, ' +
      'bot passes incoming message further', async () => {
      setMocks({ randomCheck: 0.99, reactions: testReactions.oneTextReaction });
      const result = await customReactions(testMessages.messageWithAppropriatePhrase);
      expect(result).toBe(false);
    });

    test('When bot does not find a rule to react, bot does not send anything', async () => {
      setMocks({ randomCheck: 0.001, reactions: [] });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(dbQuerySpy.mock.calls[0][0]).toMatch(testMessages.messageWithAppropriatePhrase.text);
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    test('When bot does not find a rule to react, bot passes incoming message further', async () => {
      setMocks({ randomCheck: 0.001, reactions: [] });
      const result = await customReactions(testMessages.messageWithAppropriatePhrase);
      expect(result).toBe(false);
    });

  });

  describe('Mixed case', () => {

    test('When bot finds appropriate rule to react, and random check is successful only for some rules, ' +
      'bot resets additional probability only for rules that succeeded random check', async () => {
      setMocks({ randomCheck: 0.5, reactions: testReactions.mixedSuccessfulAndFailedRandomCheck });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(dbQuerySpy.mock.calls[2][0]).toMatch(/additional_probability=0/);
      expect(dbQuerySpy.mock.calls[2][0]).toMatch(/id=1/);
      expect(dbQuerySpy.mock.calls[2][0]).toMatch(/id=2/);
      expect(dbQuerySpy.mock.calls[2][0]).not.toMatch(/id=3/);
      expect(dbQuerySpy.mock.calls[2][0]).not.toMatch(/id=4/);
    });

    test('When bot finds appropriate rule to react, and random check is successful only for some rules, ' +
      'bot increases additional probability only for rules that failed random check', async () => {
      setMocks({ randomCheck: 0.5, reactions: testReactions.mixedSuccessfulAndFailedRandomCheck });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/additional_probability=5 WHERE id=3/);
      expect(dbQuerySpy.mock.calls[1][0]).toMatch(/additional_probability=10 WHERE id=4/);
      expect(dbQuerySpy.mock.calls[1][0]).not.toMatch(/id=1/);
      expect(dbQuerySpy.mock.calls[1][0]).not.toMatch(/id=2/);
    });
  });

  describe('Different reaction types', () => {

    // Bot can send a text as a reaction - checked earlier

    test('Bot can send a picture as a reaction', async () => {
      setMocks({ randomCheck: 0.001, reactions: testReactions.onePictureReaction });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(sendPhotoToChatSpy).toHaveBeenCalledTimes(1);
    });

    test('Bot can send a YouTube video as a reaction', async () => {
      setMocks({ randomCheck: 0.001, reactions: testReactions.oneYouTubeVideoReaction });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(sendYouTubeVideoSpy).toHaveBeenCalledTimes(1);
      expect(sendYouTubeVideoSpy).toHaveBeenCalledWith(testReactions.oneYouTubeVideoReaction[0].content);
    });

    test('Bot can send a sticker as a reaction', async () => {
      setMocks({ randomCheck: 0.001, reactions: testReactions.oneStickerReaction });
      await customReactions(testMessages.messageWithAppropriatePhrase);
      await Promise.resolve();
      expect(sendStickerSpy).toHaveBeenCalledTimes(1);
      expect(sendStickerSpy).toHaveBeenCalledWith(testReactions.oneStickerReaction[0].content);
    });

  });
});

function setMocks(options: { randomCheck: number; reactions: CustomReaction[] }) {
  dbQuerySpy = jest.spyOn(db, 'query').mockImplementation(_query => {
    const rows = _query.includes('SELECT') ? options.reactions : [];
    return Promise.resolve({ rows } as QueryResult<CustomReaction>);
  });

  jest.spyOn(global.Math, 'random').mockReturnValue(options.randomCheck);
}
