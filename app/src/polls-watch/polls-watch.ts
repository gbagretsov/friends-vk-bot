import vk from '../vk/vk';
import db from '../db';
import {VkMessage, VkMessagePollAttachment} from '../vk/model/VkMessage';
import {getConcatenatedItems} from '../util';
import {VkPoll} from '../vk/model/VkPoll';
import {MissingVoteMessageGenerator} from './model/MissingVoteMessageGenerator';

// src: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
const shuffleArray = (array: unknown[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

function getPollLink(pollInfo: VkPoll) {
  return `https://vk.ru/poll${pollInfo.owner_id}_${pollInfo.id}`;
}

const singleMissingVoteMessageGenerators: MissingVoteMessageGenerator[] = [

  (poll, missingVoters, conversationMembers) => {
    const user = conversationMembers.find(user => user.id === missingVoters[0]);
    const pastTenseEnding = user?.sex === 1 ? 'а' : '';
    return `😒 @${user?.screen_name} (${user?.first_name}), ты ещё не проголосовал${pastTenseEnding} в опросе "${poll.question}"
${getPollLink(poll)}`;
  },

  (poll, missingVoters, conversationMembers) => {
    const user = conversationMembers.find(user => user.id === missingVoters[0]);
    return `🙏🏻 @${user?.screen_name} (${user?.first_name}), пожалуйста, не забудь проголосовать в опросе "${poll.question}"
${getPollLink(poll)}`;
  },

  (poll, missingVoters, conversationMembers) => {
    const user = conversationMembers.find(user => user.id === missingVoters[0]);
    return `☝🏻 @${user?.screen_name} (${user?.first_name}), в опросе "${poll.question}" не хватает твоего голоса!
${getPollLink(poll)}`;
  },

  (poll, missingVoters, conversationMembers) => {
    const user = conversationMembers.find(user => user.id === missingVoters[0]);
    return `@${user?.screen_name} (${user?.first_name}), нам всем очень интересно твоё мнение по вопросу "${poll.question}". Не томи, пройди по ссылке и проголосуй! 😊
${getPollLink(poll)}`;
  },

];

const multipleMissingVoteMessageGenerators: MissingVoteMessageGenerator[] = [

  (poll, missingVoters, conversationMembers) => {
    const concatenatedMissingVoters = missingVoters.reduce((sum, userId, i) => {
      const user = conversationMembers.find(user => user.id === userId);
      return `${sum}
 ${i + 1}. @${user?.screen_name} (${user?.first_name}) `;
    }, '');
    return `⚠⚠⚠ Важное объявление ⚠⚠⚠

Список тех, кто проигнорировал опрос "${poll.question}":
${concatenatedMissingVoters}

Прошу вас проголосовать как можно скорее. Ссылка на опрос: ${getPollLink(poll)}

С уважением,
Бот друзей
`;
  },

  (poll, missingVoters, conversationMembers) => {
    const concatenatedMissingVoters = getConcatenatedItems(missingVoters.map(userId => {
      const user = conversationMembers.find(user => user.id === userId);
      return `@${user?.screen_name} (${user?.first_name})`;
    }));
    return `☝🏻 ${concatenatedMissingVoters}, ваших голосов не хватает в опросе "${poll.question}". Ссылка на опрос: ${getPollLink(poll)}`;
  },

  (poll, missingVoters, conversationMembers) => {
    const concatenatedMissingVoters = getConcatenatedItems(missingVoters.map(userId => {
      const user = conversationMembers.find(user => user.id === userId);
      return `@${user?.screen_name} (${user?.first_name_gen})`;
    }));
    return `⚠ Объявление для ${concatenatedMissingVoters}: вам необходимо перейти по ссылке ${getPollLink(poll)} и проголосовать в опросе "${poll.question}"`;
  },

];

function deletePollFromDb(pollId: number) {
  return db
    .query(`DELETE FROM friends_vk_bot.polls WHERE id = ${pollId};`)
    .catch(error => console.log(error));
}

export async function watchPolls(): Promise<void> {

  const query = 'SELECT * FROM friends_vk_bot.polls LIMIT 5;';
  const pollsIds = (await db.query<any>(query)).rows.map(row => {
    return { id: row.id, ownerId: row.owner_id };
  });

  if (pollsIds.length === 0) {
    console.log('No polls to watch');
  } else {
    console.log(`Watched polls: ${pollsIds.map(item => `ID ${item.id}, user ${item.ownerId}`).join('; ')}`);
  }

  const polls = await vk.getPolls(pollsIds);
  // Вызов этого метода используется для проверки корректности токена доступа

  if (!polls) {
    console.log('Got empty response from VK API');
    return;
  }

  const conversationMembers = await vk.getConversationMembers();
  if (!conversationMembers) {
    return;
  }
  const conversationMembersIds = conversationMembers.map(user => user.id);

  polls.forEach(poll => {
    console.log(`Watching poll ${poll.poll_info.id} of user ${poll.poll_info.owner_id}`);
    console.log(`Question is: ${poll.poll_info.question}`);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (poll.poll_info.closed || (poll.poll_info.end_date > 0 && poll.poll_info.end_date <= currentTimestamp)) {
      console.log(`Poll ${poll.poll_info.question} is now closed`);
      deletePollFromDb(poll.poll_info.id);
      return;
    }
    if (currentTimestamp - poll.poll_info.created < 3600) {
      console.log(`It was less than one hour since poll "${poll.poll_info.question}" was created`);
      return;
    }
    const missingVoters = conversationMembersIds.filter(user => poll.voters.indexOf(user) === -1);
    shuffleArray(missingVoters);
    const missingVotersAmount = missingVoters.length;
    let missingVoteMessageGenerators: MissingVoteMessageGenerator[];
    if (missingVotersAmount === 0) {
      console.log(`No missing votes in poll "${poll.poll_info.question}"`);
      deletePollFromDb(poll.poll_info.id);
      return;
    } else if (missingVotersAmount === 1) {
      missingVoteMessageGenerators = singleMissingVoteMessageGenerators;
    } else {
      missingVoteMessageGenerators = multipleMissingVoteMessageGenerators;
    }
    const generateMessage = missingVoteMessageGenerators[Math.floor(Math.random() * missingVoteMessageGenerators.length)];
    const message = generateMessage(poll.poll_info, missingVoters, conversationMembers);
    console.log(`Sending message with missing voters for poll "${poll.poll_info.question}"`);
    vk.sendMessage({
      text: message,
    });

  });

}

export async function handleLookForPollInIncomingMessage(message: VkMessage): Promise<boolean> {
  if (vk.isPoll(message)) {
    const poll = (message.attachments[0] as VkMessagePollAttachment).poll;
    if (!poll.anonymous) {
      const query = `INSERT INTO friends_vk_bot.polls
                     VALUES (${poll.id}, ${poll.owner_id});`;
      try {
        await db.query(query);
      } catch (error) {
        console.log(error);
      }
    }
    return true;
  }
  return false;
}
