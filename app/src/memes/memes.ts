import {VkMessage, VkMessageAttachmentType} from '../vk/model/VkMessage';
import {getLargestPhotoSize} from '../util';
import {createWorker, Rectangle} from 'tesseract.js';
import {config} from 'dotenv';
import {VkKeyboard} from '../vk/model/VkKeyboard';
import vk from '../vk/vk';
import {ActionWithMessage} from '../vk/model/events/VkActionWithMessageEvent';
import db from '../db';
import {VkPhotoSize} from '../vk/model/VkPhoto';
import needle from 'needle';

config();

const EVALUATION_KEY_LABELS = ['💩', '😟', '😐', '🙂', '🤣'];
const IS_NOT_MEME_LABEL = 'Это не мем';
const EVALUATION_ACCEPTED = 'Оценка принята!';
const EVALUATION_FROM_AUTHOR_NOT_ACCEPTED = 'Оценки от автора мема не\xa0принимаются';
const SKIP_ACCEPTED = 'Я запомнил, что это не мем';

function getPhotoSize(message: VkMessage): VkPhotoSize | null {
  let photoSize = null;
  const attachment = message.attachments[0];
  if (attachment?.type === VkMessageAttachmentType.WALL) {
    const wallAttachment = attachment.wall.attachments[0];
    if (wallAttachment?.type === VkMessageAttachmentType.PHOTO) {
      photoSize = getLargestPhotoSize(wallAttachment.photo);
    }
  }
  if (attachment?.type === VkMessageAttachmentType.PHOTO) {
    photoSize = getLargestPhotoSize(attachment.photo);
  }
  return photoSize;
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

async function isMeme(message: VkMessage): Promise<boolean> {
  const photoSize = getPhotoSize(message);

  if (!photoSize) {
    return false;
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
  const isMeme = confidence > process.env.MEMES_RECOGNITION_CONFIDENCE;
  console.log(`#${message.conversation_message_id} - meme confidence is [${confidenceValues}], is meme = ${isMeme}`);
  return isMeme;
}

async function getEvaluationProposalMessage(minEvaluation: string, maxEvaluation: string, userId: number): Promise<string> {
  const user = await vk.getUserInfo(userId);
  return `Оцените мем ${user?.first_name_gen} по шкале от ${minEvaluation} до ${maxEvaluation}. Голосование анонимное.`;
}

export async function handleMessage(message: VkMessage): Promise<boolean> {
  if (await isMeme(message)) {
    const conversationMessageId = message.conversation_message_id;
    const keyboard: VkKeyboard = {
      inline: true,
      buttons: [
        EVALUATION_KEY_LABELS.map((label, index) => {
          return {
            action: {
              type: 'callback',
              label,
              payload: JSON.stringify({ conversationMessageId, evaluation: index + 1 }),
            },
            color: 'secondary',
          };
        }),
        [
          {
            action: {
              type: 'callback',
              label: IS_NOT_MEME_LABEL,
              payload: JSON.stringify({ conversationMessageId, skip: true }),
            },
            color: 'secondary',
          },
        ],
      ],
    };
    const evaluationProposalMessage = await getEvaluationProposalMessage(EVALUATION_KEY_LABELS[0], EVALUATION_KEY_LABELS[EVALUATION_KEY_LABELS.length - 1], message.from_id);
    vk.sendKeyboard(keyboard, evaluationProposalMessage, message.conversation_message_id);

    try {
      await db.query(`INSERT INTO friends_vk_bot.memes VALUES (${conversationMessageId}, ${message.from_id})`);
    } catch (error) {
      console.error(error);
    }

    return true;
  }

  return false;
}

export async function handleActionWithMessage(action: ActionWithMessage): Promise<boolean> {
  const { event_id, payload, user_id } = action;
  if (!payload?.conversationMessageId) {
    return false;
  }
  const { conversationMessageId, skip } = payload;
  const eventData = { type: 'show_snackbar', text: '' };

  const dbResponse = await db.query<{conversation_message_id: number, author_id: number}>
  (`SELECT conversation_message_id, author_id FROM friends_vk_bot.memes WHERE conversation_message_id = ${conversationMessageId};`);
  const savedMeme = dbResponse.rows[0];
  if (!savedMeme) {
    console.log(`Meme with cmid = ${conversationMessageId} not found`);
    return false;
  }

  if (skip) {
    vk.deleteMessage(conversationMessageId as number + 1);
    eventData.text = SKIP_ACCEPTED;
  } else {
    if (user_id === savedMeme.author_id) {
      eventData.text = EVALUATION_FROM_AUTHOR_NOT_ACCEPTED;
    } else {
      eventData.text = EVALUATION_ACCEPTED;
    }
  }
  vk.sendMessageEventAnswer(user_id, event_id, eventData);
  return true;
}
