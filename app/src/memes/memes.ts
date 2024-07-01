import {VkMessage, VkMessageAttachmentType} from '../vk/model/VkMessage';
import {getLargestPhotoSize} from '../util';
import {createWorker, Rectangle} from 'tesseract.js';
import {config} from 'dotenv';
import {VkKeyboard} from '../vk/model/VkKeyboard';
import vk from '../vk/vk';
import {ActionWithMessage} from '../vk/model/events/VkActionWithMessageEvent';
import db, {DUPLICATE_KEY_PG_ERROR} from '../db';
import {VkPhoto, VkPhotoSize} from '../vk/model/VkPhoto';
import needle from 'needle';
import crypto from 'crypto';
import {MemesPerAuthor, MemesStatistics, TopMeme} from './model/MemesStatistics';
import {MessageReaction} from '../vk/model/events/VkMessageReactionEvent';
import {VkReaction} from '../vk/model/VkReaction';

config();

const EVALUATION_KEY_LABELS = ['💩', '😟', '😐', '🙂', '🤣'];
const IS_NOT_MEME_LABEL = 'Это не мем';

async function getEvaluationProposalMessage(minEvaluation: string, maxEvaluation: string, userId: number): Promise<string> {
  const user = await vk.getUserInfo(userId);
  return `Оцените мем ${user?.first_name_gen} по шкале от ${minEvaluation} до ${maxEvaluation}. Голосование анонимное.`;
}

const EVALUATION_ACCEPTED = 'Оценка принята!';
const EVALUATION_CHANGED = 'Оценка изменена!';
const EVALUATION_FROM_AUTHOR_NOT_ACCEPTED = 'Оценки от автора мема не\xa0принимаются';

const SKIP_REQUEST_ACCEPTED = 'Вы считаете, что это не\xa0мем';
const YOUR_SKIP_REQUEST_IS_ALREADY_PRESENT = 'Вы уже отметили, что это не\xa0мем';
const MEME_IS_SKIPPED = 'Я запомнил, что это не\xa0мем';

const ERROR_OCCURED = 'Произошла ошибка, попробуйте позже';

const REQUIRED_SKIP_REQUESTS = 2;
const REQUIRED_EVALUATIONS = 3;
const TOP_MEMES_AMOUNT_LIMIT = 10;
const MEMES_DIR = 'memes';

export function getPhotoAttachment(message: VkMessage): VkPhoto | null {
  const attachment = message.attachments[0];
  if (attachment?.type === VkMessageAttachmentType.WALL) {
    const wallAttachment = attachment.wall.attachments[0];
    if (wallAttachment?.type === VkMessageAttachmentType.PHOTO) {
      return wallAttachment.photo;
    }
  }
  if (attachment?.type === VkMessageAttachmentType.PHOTO) {
    return attachment.photo;
  }
  return null;
}

export function getPhotoSize(message: VkMessage): VkPhotoSize | null {
  const photo = getPhotoAttachment(message);
  if (photo) {
    return getLargestPhotoSize(photo);
  }
  return null;
}

function getRectangles(photoSize: VkPhotoSize): Rectangle[] {
  const PARTS = 4;
  const partHeight = Math.floor(photoSize.height / PARTS);
  return [
    {
      left: 1,
      top: 1,
      width: photoSize.width - 2,
      height: photoSize.height - 2,
    },
    ...Array(PARTS).fill(0).map((_, i) => {
      return {
        left: 1,
        top: partHeight * i + 1,
        width: photoSize.width - 2,
        height: partHeight - 1,
      };
    })
  ];
}

async function isMeme(message: VkMessage, skipTextRecognition = false): Promise<boolean> {
  const photoSize = getPhotoSize(message);
  const state = await db.query<{key: string, value: string}>
  ('SELECT value FROM friends_vk_bot.state WHERE key = \'memes_recognition_confidence\';');
  const requiredConfidence = state.rows[0].value;

  if (!photoSize) {
    console.log(`No photos in message #${message.conversation_message_id}`);
    return false;
  }
  if (requiredConfidence === '' || +requiredConfidence > 100) {
    console.log(`Memes feature is disabled, skip message #${message.conversation_message_id}`);
    return false;
  }

  if (skipTextRecognition) {
    return true;
  }

  const imageLoadResponse = await needle('get', photoSize.url, null, { follow_max: 1 });
  const imageBuffer = imageLoadResponse.body;

  const worker = await createWorker('rus');
  const rectangles = getRectangles(photoSize);

  const confidenceValues = [];
  for (const rectangle of rectangles) {
    const recognitionResult = await worker.recognize(imageBuffer, { rectangle });
    confidenceValues.push(recognitionResult.data.confidence);
  }
  await worker.terminate();

  const confidence = Math.max(...confidenceValues);
  const isMeme = confidence > +requiredConfidence;
  console.log(`#${message.conversation_message_id} - meme confidence is [${confidenceValues}], required = ${requiredConfidence}, is meme = ${isMeme}`);
  return isMeme;
}

async function handleMessageWithMeme(message: VkMessage) {
  const conversationMessageId = message.conversation_message_id;
  const keyboard: VkKeyboard = {
    inline: true,
    buttons: [
      EVALUATION_KEY_LABELS.map((label, index) => {
        return {
          action: {
            type: 'callback',
            label,
            payload: JSON.stringify({conversationMessageId, evaluation: index + 1}),
          },
          color: 'secondary',
        };
      }),
      [
        {
          action: {
            type: 'callback',
            label: IS_NOT_MEME_LABEL,
            payload: JSON.stringify({conversationMessageId, skip: true}),
          },
          color: 'secondary',
        },
      ],
    ],
  };

  try {
    await db.query(`INSERT INTO friends_vk_bot.memes VALUES (${conversationMessageId}, ${message.from_id})`);
    const evaluationProposalMessage = await getEvaluationProposalMessage(EVALUATION_KEY_LABELS[0], EVALUATION_KEY_LABELS[EVALUATION_KEY_LABELS.length - 1], message.from_id);
    vk.sendMessage({
      keyboard,
      text: evaluationProposalMessage,
      replyToConversationMessageId: message.conversation_message_id,
    });
  } catch (error) {
    const isDuplicateMeme = (error as any).code === DUPLICATE_KEY_PG_ERROR;
    if (isDuplicateMeme) {
      console.log(`Meme #${message.conversation_message_id} was already saved`);
    } else {
      console.error(error);
    }
  }
}

export async function handleMessage(message: VkMessage): Promise<boolean> {
  if (await isMeme(message)) {
    handleMessageWithMeme(message);
    return true;
  }

  return false;
}

export async function handleReaction(reaction: MessageReaction): Promise<boolean> {
  const reactionId = reaction.reaction_id;
  const reactionUserId = reaction.reacted_id;
  const message = await vk.getMessageByConversationMessageId(reaction.cmid);

  if (!message || reactionId !== VkReaction.QUESTION || reactionUserId !== message.from_id) {
    return false;
  }

  if (await isMeme(message, true)) {
    handleMessageWithMeme(message);
    return true;
  }

  return false;
}

async function handleSkipRequest(memeCmid: number, evaluationRequestCmid: number, userId: string): Promise<string> {
  const dbResponse = await db.query<{ user_id: string }>
  (`SELECT user_id FROM friends_vk_bot.memes_skip WHERE conversation_message_id = ${memeCmid};`);
  const skips = dbResponse.rows.map(r => r.user_id);

  if (skips.includes(userId)) {
    return YOUR_SKIP_REQUEST_IS_ALREADY_PRESENT;
  }

  if (skips.length >= REQUIRED_SKIP_REQUESTS - 1) {
    db.query(`DELETE FROM friends_vk_bot.memes WHERE conversation_message_id = ${memeCmid}`);
    vk.deleteMessage(evaluationRequestCmid);
    return MEME_IS_SKIPPED;
  }

  db.query(`INSERT INTO friends_vk_bot.memes_skip (conversation_message_id, user_id) VALUES (${memeCmid}, '${userId}')
                ON CONFLICT ON CONSTRAINT one_skip_per_user DO NOTHING`);
  return SKIP_REQUEST_ACCEPTED;
}

export async function handleActionWithMessage(action: ActionWithMessage): Promise<boolean> {
  const { event_id, payload, user_id } = action;
  if (!payload?.conversationMessageId) {
    return false;
  }
  const { conversationMessageId, skip, evaluation } = payload;
  const eventData = { type: 'show_snackbar', text: '' };
  const userHash = crypto.createHash('md5').update(`${conversationMessageId}_${user_id}`).digest('hex');

  const dbResponse = await db.query<{conversation_message_id: number, author_id: number}>
  (`SELECT conversation_message_id, author_id FROM friends_vk_bot.memes WHERE conversation_message_id = ${conversationMessageId};`);
  const savedMeme = dbResponse.rows[0];

  if (!savedMeme) {
    console.log(`Meme with cmid = ${conversationMessageId} not found`);
    eventData.text = ERROR_OCCURED;
  } else if (skip) {
    eventData.text = await handleSkipRequest(conversationMessageId as number, action.conversation_message_id, userHash);
  } else if (user_id === savedMeme.author_id) {
    eventData.text = EVALUATION_FROM_AUTHOR_NOT_ACCEPTED;
  } else {
    try {
      const res = await db.query<{is_changed: boolean}>(
        `INSERT INTO friends_vk_bot.memes_evaluations (conversation_message_id, user_id, evaluation) VALUES (${conversationMessageId}, '${userHash}', ${evaluation})
        ON CONFLICT ON CONSTRAINT one_evaluation_per_user DO UPDATE SET evaluation = EXCLUDED.evaluation, is_changed = true RETURNING is_changed`);
      eventData.text = res.rows[0].is_changed ? EVALUATION_CHANGED : EVALUATION_ACCEPTED;
    } catch (error: unknown) {
      console.log(error);
      eventData.text = ERROR_OCCURED;
    }
  }
  vk.sendMessageEventAnswer(user_id, event_id, eventData);
  return true;
}

function getMemePath(conversationMessageId: number) {
  return `${MEMES_DIR}/${conversationMessageId}.jpg`;
}

export async function getMemesStatistics(): Promise<MemesStatistics> {
  const result = await db.query<{
    conversation_message_id: number;
    author_id: number;
    rating: number;
    evaluations_count: number;
    memes_count: number;
  }>(`
    SELECT memes.conversation_message_id,
           memes.author_id,
           avg(evaluation) AS rating,
           count(*) as evaluations_count,
           memes_count
    FROM friends_vk_bot.memes
    JOIN friends_vk_bot.memes_evaluations me ON memes.conversation_message_id = me.conversation_message_id
    JOIN (
        SELECT memes.author_id, count(*) as memes_count
        FROM friends_vk_bot.memes
        GROUP BY memes.author_id
    ) mc ON memes.author_id = mc.author_id
    GROUP BY memes.conversation_message_id, memes_count
    HAVING count(*) >= ${REQUIRED_EVALUATIONS}
    ORDER BY rating DESC, evaluations_count DESC, memes_count
    LIMIT ${TOP_MEMES_AMOUNT_LIMIT}
  `);

  const memesPerAuthor: MemesPerAuthor = { };
  const topMemes: TopMeme[] = result.rows.map<TopMeme>(row => {
    memesPerAuthor[row.author_id] = row.memes_count;
    return {
      cmidId: row.conversation_message_id,
      authorId: row.author_id,
      rating: +row.rating,
      evaluationsCount: row.evaluations_count,
    };
  });

  return {
    topMemes,
    memesPerAuthor,
  };
}

export async function resetMemesStatistics(): Promise<void> {
  console.log('Resetting memes statistics...');
  try {
    await db.query('TRUNCATE TABLE friends_vk_bot.memes, friends_vk_bot.memes_skip, friends_vk_bot.memes_evaluations');
  } catch (error) {
    console.log(error);
  }
  console.log('Resetting memes statistics done');
}
