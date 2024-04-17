-- Up migration

CREATE TABLE IF NOT EXISTS friends_vk_bot.memes
(
    conversation_message_id INTEGER NOT NULL PRIMARY KEY,
    author_id BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS friends_vk_bot.memes_evaluations
(
    id SERIAL NOT NULL PRIMARY KEY,
    conversation_message_id INTEGER NOT NULL REFERENCES friends_vk_bot.memes(conversation_message_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    evaluation INTEGER NOT NULL,
    is_changed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE friends_vk_bot.memes_evaluations ADD CONSTRAINT one_evaluation_per_user UNIQUE (conversation_message_id, user_id);

-- Down migration

DROP TABLE IF EXISTS friends_vk_bot.memes_evaluations CASCADE;
DROP TABLE IF EXISTS friends_vk_bot.memes CASCADE;
