import {VkMessage, VkMessageAttachmentType} from '../vk/model/VkMessage';
import {getLargestPhotoSize} from '../util';
import {createWorker} from 'tesseract.js';
import {config} from 'dotenv';
import {VkKeyboard} from '../vk/model/VkKeyboard';
import vk from '../vk/vk';
import {ActionWithMessage} from '../vk/model/events/VkActionWithMessageEvent';

config();

const EVALUATION_KEY_LABELS = ['💩', '😟', '😐', '🙂', '🤣'];
const IS_NOT_MEME_LABEL = 'Это не мем';
const EVALUATION_ACCEPTED = 'Оценка принята!';
const SKIP_ACCEPTED = 'Я запомнил, что это не мем';

async function isMeme(message: VkMessage): Promise<boolean> {
  let imageUrl = null;
  const attachment = message.attachments[0];
  if (attachment?.type === VkMessageAttachmentType.WALL) {
    const wallAttachment = attachment.wall.attachments[0];
    if (wallAttachment?.type === VkMessageAttachmentType.PHOTO) {
      imageUrl = getLargestPhotoSize(wallAttachment.photo).url;
    }
  }
  if (attachment?.type === VkMessageAttachmentType.PHOTO) {
    imageUrl = getLargestPhotoSize(attachment.photo).url;
  }
  if (!imageUrl) {
    return false;
  }
  const worker = await createWorker('rus');
  const recognitionResult = await worker.recognize(imageUrl);
  await worker.terminate();
  const confidence = recognitionResult.data.confidence;
  const isMeme = confidence > process.env.MEMES_RECOGNITION_CONFIDENCE;
  console.log(`${imageUrl} - text recognition confidence is ${confidence}, is meme = ${isMeme}`);
  return isMeme;
}

function getEvaluationProposalMessage(minEvaluation: string, maxEvaluation: string): string {
  return `Оцените мем по шкале от ${minEvaluation} до ${maxEvaluation}. Голосование анонимное.`;
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
    vk.sendKeyboard(keyboard, getEvaluationProposalMessage(EVALUATION_KEY_LABELS[0], EVALUATION_KEY_LABELS[EVALUATION_KEY_LABELS.length - 1]), message.conversation_message_id);
    return true;
  }

  return false;
}

export async function handleActionWithMessage(action: ActionWithMessage): Promise<boolean> {
  const { event_id, payload, user_id } = action;
  if (!payload?.conversationMessageId) {
    return false;
  }
  const eventData = { type: 'show_snackbar', text: '' };
  if (payload.skip) {
    vk.deleteMessage(payload.conversationMessageId as number + 1);
    eventData.text = SKIP_ACCEPTED;
  } else {
    eventData.text = EVALUATION_ACCEPTED;
  }
  vk.sendMessageEventAnswer(user_id, event_id, eventData);
  return true;
}
