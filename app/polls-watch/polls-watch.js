const vk = require('../vk');
const db = require('../db');

// src: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

const singleMissingVoteMessageGenerators = [

    (poll, conversationMembers) => {
        const user = conversationMembers.find(user => user.id === poll.missingVoters[0]);
        const pastTenseEnding = user.sex === 1 ? 'а' : '';
        return `😒 @${user.screen_name} (${user.first_name}), ты ещё не проголосовал${pastTenseEnding} в опросе "${poll.poll_info.question}"`;
    },

    (poll, conversationMembers) => {
        const user = conversationMembers.find(user => user.id === poll.missingVoters[0]);
        return `🙏🏻 @${user.screen_name} (${user.first_name}), пожалуйста, не забудь проголосовать в опросе "${poll.poll_info.question}"`;
    },

    (poll, conversationMembers) => {
        const user = conversationMembers.find(user => user.id === poll.missingVoters[0]);
        return `☝🏻 @${user.screen_name} (${user.first_name}), в опросе "${poll.poll_info.question}" не хватает твоего голоса!`;
    },

    (poll, conversationMembers) => {
        const user = conversationMembers.find(user => user.id === poll.missingVoters[0]);
        return `@${user.screen_name} (${user.first_name}), нам всем очень интересно твоё мнение по вопросу "${poll.poll_info.question}". Не томи, проголосуй! 😊`;
    },

];

const multipleMissingVoteMessageGenerators = [

    (poll, conversationMembers) => {
        let concatenatedMissingVoters = poll.missingVoters.reduce((sum, userId, i, arr) => {
            const user = conversationMembers.find(user => user.id === userId);
            return `${sum}
 ${i + 1}. @${user.screen_name} (${user.first_name}) `;
        }, '');
        return `⚠⚠⚠ Важное объявление ⚠⚠⚠

Список тех, кто проигнорировал опрос "${poll.poll_info.question}":
${concatenatedMissingVoters}

Прошу вас проголосовать как можно скорее.

С уважением,
Бот друзей
`;
    },

    (poll, conversationMembers) => {
        let concatenatedMissingVoters = poll.missingVoters.reduce((sum, userId, i, arr) => {
            const user = conversationMembers.find(user => user.id === userId);
            if (i === 0) {
                return `@${user.screen_name} (${user.first_name})`;
            } else if (i === arr.length - 1) {
                return `${sum} и @${user.screen_name} (${user.first_name})`;
            } else {
                return `${sum}, @${user.screen_name} (${user.first_name})`;
            }
        }, '');
        return `☝🏻 ${concatenatedMissingVoters}, ваших голосов не хватает в опросе "${poll.poll_info.question}"`;
    },

    (poll, conversationMembers) => {
        let concatenatedMissingVoters = poll.missingVoters.reduce((sum, userId, i, arr) => {
            const user = conversationMembers.find(user => user.id === userId);
            if (i === 0) {
                return `@${user.screen_name} (${user.first_name_gen})`;
            } else if (i === arr.length - 1) {
                return `${sum} и @${user.screen_name} (${user.first_name_gen})`;
            } else {
                return `${sum}, @${user.screen_name} (${user.first_name_gen})`;
            }
        }, '');
        return `⚠ Объявление для ${concatenatedMissingVoters}: вам необходимо проголосовать в опросе "${poll.poll_info.question}"`;
    },

];

module.exports.watchPolls = async function() {

    let query = `SELECT * FROM friends_vk_bot.polls LIMIT 5;`;
    let client = db();

    let pollsIds = await client.query(query);
    await client.end();
    pollsIds = pollsIds.rows.map(row => {
        return { id: row.id, ownerId: row.owner_id };
    });

    if (pollsIds.length === 0) {
        console.log('No polls to watch');
        return;
    }

    const polls = await vk.getPolls(pollsIds);
    const conversationMembers = await vk.getConversationMembers();
    const conversationMembersIds = conversationMembers.map(user => user.id);

    function deletePollFromDb(poll) {
        let client = db();
        return client.query(`DELETE FROM friends_vk_bot.polls WHERE id = ${poll.id};`)
            .catch(error => console.log(error))
            .then(() => client.end());
    }

    polls.forEach(poll => {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (poll.closed || (poll.poll_info.end_date > 0 && poll.poll_info.end_date <= currentTimestamp)) {
            console.log(`Poll ${poll.poll_info.question} is now closed`);
            deletePollFromDb(poll.poll_info);
            return;
        }
        if (currentTimestamp - poll.poll_info.created < 3600) {
            console.log(`It was less than one hour since poll ${poll.poll_info.question} was created`);
            return;
        }
        poll.missingVoters = conversationMembersIds.filter(user => poll.voters.indexOf(user) === -1);
        shuffleArray(poll.missingVoters);
        const missingVotersAmount = poll.missingVoters.length;
        let missingVoteMessageGenerators;
        if (missingVotersAmount === 0) {
            console.log(`No missing votes in poll ${poll.poll_info.question}`);
            deletePollFromDb(poll.poll_info);
            return;
        } else if (missingVotersAmount === 1) {
            missingVoteMessageGenerators = singleMissingVoteMessageGenerators;
        } else {
            missingVoteMessageGenerators = multipleMissingVoteMessageGenerators;
        }
        const generateMessage = missingVoteMessageGenerators[Math.floor(Math.random() * missingVoteMessageGenerators.length)];
        const message = generateMessage(poll, conversationMembers);
        console.log(`Sending message with missing voters for poll ${poll.poll_info.question}`);
        vk.sendMessage(message);

    });

};

module.exports.handleLookForPollInIncomingMessage = function(message) {
    if (message.attachments && message.attachments[0] && message.attachments[0].type === 'poll') {
        const poll = message.attachments[0].poll;
        if (!poll.anonymous) {
            const client = db();
            const query = `INSERT INTO friends_vk_bot.polls VALUES (${poll.id}, ${poll.owner_id});`;
            client.query(query).then(() => client.end());
        }
        return true;
    }
    return false;
};
