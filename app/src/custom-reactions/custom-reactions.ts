import vk from '../vk/vk';
import db from '../db';
import needle from 'needle';
import {VkMessage} from '../vk/model/VkMessage';
import {CustomReaction} from './model/CustomReaction';
import {CustomReactionType} from './model/CustomReactionType';

const ADDITIONAL_PROBABILITY_INCREASE_STEP = 5;

async function handleMessage(message: VkMessage): Promise<boolean> {
  const text = message.text;
  const stickerId = vk.getStickerId(message);

  if (!text && !stickerId) {
    return false;
  }

  const customReactions = text ? await getReactionForText(text) : await getReactionForSticker(stickerId as number);
  if (customReactions.length === 0) {
    console.log('No custom reaction found, return');
    return false;
  }

  if (customReactions.findIndex(reaction => reaction.baseProbability > 0) === -1) {
    console.log('All possible custom reactions are disabled, return');
    return false;
  }

  const randomCheck = Math.random() * 100;
  console.log(`Random check is ${randomCheck}%`);

  const customReactionsWithFailedRandomCheck = customReactions.filter(reaction => reaction.baseProbability + reaction.additionalProbability <= randomCheck);
  await increaseAdditionalProbability(customReactionsWithFailedRandomCheck);

  const customReactionsWithSuccessfulRandomCheck = customReactions.filter(reaction => reaction.baseProbability + reaction.additionalProbability > randomCheck);
  await resetAdditionalProbability(customReactionsWithSuccessfulRandomCheck);

  if (customReactionsWithSuccessfulRandomCheck.length === 0) {
    console.log('Random check is not successful, return');
    return false;
  } else {
    console.log(`Possible reactions: \n - ${ customReactionsWithSuccessfulRandomCheck.map(reaction => reaction.content).join('\n - ') }`);
  }

  const customReaction = customReactionsWithSuccessfulRandomCheck[Math.floor(Math.random() * customReactionsWithSuccessfulRandomCheck.length)];

  console.log(`Custom reaction type is ${customReaction.type}, content is ${customReaction.content}`);

  if (customReaction.type === CustomReactionType.TEXT) {
    vk.sendMessage(customReaction.content, 5000);
  }

  if (customReaction.type === CustomReactionType.PICTURE) {
    const redirectOptions = { follow_max: 1 };
    const downloadLink = getDownloadLinkByGoogleDiskWebViewLink(customReaction.content);
    needle('get', downloadLink, null, redirectOptions).then(response => {
      const imageBuffer = response.body;
      vk.sendPhotoToChat(imageBuffer);
    });
  }

  if (customReaction.type === CustomReactionType.YOUTUBE_VIDEO) {
    vk.sendYouTubeVideo(customReaction.content);
  }

  if (customReaction.type === CustomReactionType.STICKER) {
    vk.sendSticker(customReaction.content);
  }

  return true;
}

async function getReactionForText(text: string): Promise<CustomReaction[]> {
  const query = `
    SELECT
      friends_vk_bot.custom_reactions.id,
      friends_vk_bot.custom_reactions.base_probability AS "baseProbability",
      friends_vk_bot.custom_reactions.additional_probability AS "additionalProbability",
      friends_vk_bot.responses.type AS type,
      friends_vk_bot.responses.content AS content
    FROM friends_vk_bot.custom_reactions
        JOIN friends_vk_bot.phrases ON phrases.reaction_id = custom_reactions.id
        JOIN friends_vk_bot.responses ON responses.reaction_id = custom_reactions.id
    WHERE '${text}' ILIKE '%' || friends_vk_bot.phrases.text || '%'
  `;
  const dbResult = await db.query<CustomReaction>(query);
  return dbResult.rows;
}

async function getReactionForSticker(stickerId: number): Promise<CustomReaction[]> {
  const query = `
    SELECT
      friends_vk_bot.custom_reactions.id,
      friends_vk_bot.custom_reactions.base_probability AS "baseProbability",
      friends_vk_bot.custom_reactions.additional_probability AS "additionalProbability",
      friends_vk_bot.responses.type AS type,
      friends_vk_bot.responses.content AS content
    FROM friends_vk_bot.custom_reactions
        JOIN friends_vk_bot.stickers ON stickers.reaction_id = custom_reactions.id
        JOIN friends_vk_bot.responses ON responses.reaction_id = custom_reactions.id
    WHERE friends_vk_bot.stickers.sticker_id = ${stickerId}
  `;
  const dbResult = await db.query<CustomReaction>(query);
  return dbResult.rows;
}

async function increaseAdditionalProbability(customReactions: CustomReaction[]): Promise<void> {
  if (customReactions.length === 0) {
    return;
  }

  let query = 'BEGIN TRANSACTION;\n';
  customReactions.sort((a, b) => a.id - b.id).forEach(reaction => {
    query +=
      `UPDATE friends_vk_bot.custom_reactions 
       SET additional_probability=${reaction.additionalProbability + ADDITIONAL_PROBABILITY_INCREASE_STEP} WHERE id=${reaction.id};\n`;
  });
  query += 'COMMIT';
  try {
    await db.query(query);
  } catch(error) {
    console.log(error);
  }
}

async function resetAdditionalProbability(customReactions: CustomReaction[]): Promise<void> {
  if (customReactions.length === 0) {
    return;
  }

  let query = 'BEGIN TRANSACTION;\n';
  customReactions.sort((a, b) => a.id - b.id).forEach(reaction => {
    query += `UPDATE friends_vk_bot.custom_reactions SET additional_probability=0 WHERE id=${reaction.id};\n`;
  });
  query += 'COMMIT';
  try {
    await db.query(query);
  } catch(error) {
    console.log(error);
  }
}

function getDownloadLinkByGoogleDiskWebViewLink(googleDiskWebViewLink: string): string {
  return googleDiskWebViewLink
    .replace('https://drive.google.com/file/d/', 'https://drive.google.com/uc?id=')
    .replace('/view?usp=sharing', '&export=download');
}

export default handleMessage;
