-- Up migration

CREATE TABLE IF NOT EXISTS friends_vk_bot.memes_skip
(
    id SERIAL NOT NULL PRIMARY KEY,
    conversation_message_id INTEGER NOT NULL REFERENCES friends_vk_bot.memes(conversation_message_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL
);

ALTER TABLE friends_vk_bot.memes_skip ADD CONSTRAINT one_skip_per_user UNIQUE (conversation_message_id, user_id);


-- Down migration

DROP TABLE IF EXISTS friends_vk_bot.memes_skip CASCADE;
