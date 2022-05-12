import needle from 'needle';
import {config} from 'dotenv';
import vk from '../vk/vk';
import dbClient from '../db';
import admin from './admin';
import {getPluralForm} from '../util';
import {VkMessage} from '../vk/model/VkMessage';
import {AddWordResult} from './model/AddWordResult';

config();

const STEP_INTERVAL = process.env.GAME_STEP_INTERVAL ? parseInt(process.env.GAME_STEP_INTERVAL) : 15000;

let message: VkMessage;
let answer = '';
let isPlaying = false;
let gameId = '';
let timeoutObj: NodeJS.Timeout;
let taskImgBuffer: Buffer | null;
let hintImgBuffer: Buffer | null;
let lettersHintSent = false;

async function getRandomTask(): Promise<string> {
  const query = `
    SELECT name FROM friends_vk_bot.words WHERE approved = true
    ORDER BY RANDOM() LIMIT 1;
  `;

  const dbResult = await dbClient.query<any>(query);
  return dbResult.rows[0].name;
}

async function handleMessage(_message: VkMessage): Promise<boolean> {
  message = _message;
  if (!message.text) {
    return false;
  }
  if (isAddWordRequest(message.text)) {
    await handleAddWordRequest(message.text);
    return true;
  }
  if (isDeleteWordRequest(message.text)) {
    await handleDeleteWordRequest(message.text);
    return true;
  }
  if (isPlaying) {
    return await handlePlayingState();
  }
  if (isGameRequestMessage(message.text)) {
    await handleGameRequestMessage();
    return true;
  }
  return false;
}

function isAddWordRequest(text: string): boolean {
  const botMentioned = isBotMentioned(text);
  const containsAddWordRequest = text.includes('запомни слово');
  return botMentioned && containsAddWordRequest;
}

async function handleAddWordRequest(text: string): Promise<void> {
  const word = extractWord(text);

  if (word) {
    const result = await admin.addWord(word, true);
    if (result === AddWordResult.DUPLICATE_WORD) {
      await vk.sendMessage(`Я уже знаю слово "${ word }"! 😊`, 3000);
    } else if (result === AddWordResult.SUCCESS) {
      await vk.sendMessage(`👍 Я запомнил слово "${ word }"!`, 3000);
    }
  } else {
    const userName = await vk.getUserName(message.from_id);
    await vk.sendMessage(`${userName}, я тебя не понимаю 😒`, 3000);
  }
}

function isDeleteWordRequest(text: string): boolean {
  const botMentioned = isBotMentioned(text);
  const containsDeleteWordRequest = text.includes('забудь слово');
  return botMentioned && containsDeleteWordRequest;
}

async function handleDeleteWordRequest(text: string): Promise<void> {
  const word = extractWord(text);

  if (word) {
    await admin.deleteWord(word);
    await vk.sendMessage(`👍 Я забыл слово "${ word }"!`, 3000);
  } else {
    const userName = await vk.getUserName(message.from_id);
    await vk.sendMessage(`${userName}, я тебя не понимаю 😒`, 3000);
  }
}

function extractWord(text: string): string | null {
  const parts = text.split(' ');
  const word = parts[parts.length - 1].replace(/[.,/#!$%^&*;:{}=\-_`~()a-zA-Z\d]/g, '');
  return word === '' ? null : word;
}

async function handleGameRequestMessage(): Promise<void> {

  if (isPlaying) {
    console.log('Game is already running, cannot start new game');
    return;
  }

  isPlaying = true;
  gameId = Date.now().toString();
  answer = await getRandomTask();
  console.log(`Correct answer: ${answer}`);
  try {
    await generatePhotos(answer);
    const welcomeMessages = [
      'Игра начинается, отгадывать могут все! 😏 Какое слово я загадал?',
      'Я люблю играть! 😊 Я загадал слово, которое описывает эту картинку. Сможете угадать это слово?',
    ];
    await vk.sendMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)], 3000);
    await vk.sendPhotoToChat(taskImgBuffer!);
    if (Math.random() > 0.5) {
      await vk.sendMessage(getLettersHintMessage());
      lettersHintSent = true;
    }
    timeoutObj = setTimeout(async () => await giveHint(gameId), STEP_INTERVAL);
  } catch (error) {
    resetGame();

    if (error instanceof Error && error.message === 'usageLimits') {
      const limitsMessages = [
        'Что-то я устал играть... 😫 Приходите завтра 😊',
        'Давай продолжим завтра? Сегодня больше не хочется 😳',
        'Я уже наигрался, мне надо отдохнуть',
      ];

      const limitsStickers = [13, 85, 2091, 5135, 5629];

      await vk.sendSticker(limitsStickers[Math.floor(Math.random() * limitsStickers.length)]);
      await vk.sendMessage(limitsMessages[Math.floor(Math.random() * limitsMessages.length)], 5000);
    } else {
      console.log(error);
    }
  }
}

async function generatePhotos(answer: string): Promise<void> {
  const apiURL = 'https://www.googleapis.com/customsearch/v1';
  const key = process.env.GOOGLE_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const start = randomInteger(1, 5);

  const url = `${apiURL}?q=${encodeURIComponent(answer)}&cx=${cx}&fileType=jpg&num=2&safe=active&searchType=image&fields=items%2Flink&start=${start}&key=${key}`;
  const googleResponse = await needle('get', url);
  console.log(googleResponse.body);
  if (googleResponse.body.error?.errors[0].domain === 'usageLimits') {
    throw new Error('usageLimits');
  }
  const taskImgURL = googleResponse.body.items[0].link;
  const hintImgURL = googleResponse.body.items[1].link;
  const redirectOptions = { follow_max: 2 };
  const taskImgResponse = await needle('get', taskImgURL, null, redirectOptions);
  const hintImgResponse = await needle('get', hintImgURL, null, redirectOptions);
  console.log('Task and hint images are downloaded');
  taskImgBuffer = taskImgResponse.body;
  hintImgBuffer = hintImgResponse.body;
}

function randomInteger(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

function getLettersHintMessage(): string {
  const lettersAmountInfo = `${answer.length} ${getPluralForm(answer.length, 'буква', 'буквы', 'букв')}`;
  return `В моём слове ${lettersAmountInfo}, первая — ${answer[0].toUpperCase()}`;
}

async function giveHint(previousGameId: string): Promise<void> {
  console.log('Giving hint...');
  const hintMessages = [
    'Никто не знает? 😒 Вот подсказка!',
    'Я не думал, что будет так сложно... 😥 Держите подсказку',
  ];

  await vk.sendMessage(hintMessages[Math.floor(Math.random() * hintMessages.length)]);
  await vk.sendPhotoToChat(hintImgBuffer!);
  if (!lettersHintSent) {
    await vk.sendMessage(getLettersHintMessage());
  }

  if (previousGameId === gameId) {
    timeoutObj = setTimeout(async () => {
      await handleGameLoss(previousGameId);
    }, STEP_INTERVAL);
  } else {
    console.log('Previous game is over, no need to handle game loss');
  }
}

async function handleGameLoss(previousGameId: string): Promise<void> {
  console.log('Handling game loss...');
  if (previousGameId !== gameId) {
    return;
  }
  const answerMessages = [
    `Не разгадали? Это же ${answer}!`,
    `⏱ Время истекло! Правильный ответ — ${answer}`,
  ];

  resetGame();

  await vk.sendMessage(answerMessages[Math.floor(Math.random() * answerMessages.length)]);
}

function resetGame():void {
  isPlaying = false;
  answer = '';
  gameId = '';
  taskImgBuffer = null;
  hintImgBuffer = null;
  lettersHintSent = false;
}

async function handleCorrectAnswer(): Promise<void> {
  clearTimeout(timeoutObj);
  const previousAnswer = answer;
  resetGame();
  const name = await vk.getUserName(message.from_id);
  const successMessages = [
    `Браво, ${name}! Моё слово — ${previousAnswer} 👏`,
    `${name}, ты умница! 😃 На картинке ${previousAnswer}`,
    `Правильно, ${name}! 👍 Это действительно ${previousAnswer}`,
    `И в этом раунде побеждает ${name}, разгадав слово "${previousAnswer}"! 😎`,
    `Я увидел правильный ответ — ${previousAnswer}! ${name}, как тебе это удаётся? 🙀`,
  ];
  const successMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
  await vk.sendMessage(successMessage);
}

async function handlePlayingState(): Promise<boolean> {
  const text = message.text.toLowerCase();

  // Если игра уже идёт, но кто-то написал новый запрос на игру,
  // нужно закончить обработку этого сообщения, чтобы не было наложений сценариев бота
  if (isGameRequestMessage(text)) {
    console.log('Game is already running, stop passing further');
    return true;
  }

  if (text === answer.toLowerCase()) {
    await handleCorrectAnswer();
    return true;
  } else {
    const word = extractWord(text);
    const botMentioned = isBotMentioned(text);
    if (word && !botMentioned) {
      await admin.addWord(word, false);
    }
    return !!word && !botMentioned;
  }
}

function isBotMentioned(text: string): boolean {
  return text.toLowerCase().startsWith('бот,') || text.includes(`club${process.env.VK_GROUP_ID}`);
}

function isGameRequestMessage(text: string): boolean {
  const _text = text.toLowerCase();
  const botMentioned = isBotMentioned(_text);
  const gameRequested =
    _text.includes(' игр') ||
    _text.includes('поигра') ||
    _text.includes('сыгра');
  return botMentioned && gameRequested;
}

export default handleMessage;
