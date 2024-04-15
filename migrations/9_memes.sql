-- Up migration

CREATE TABLE IF NOT EXISTS friends_vk_bot.memes
(
    conversation_message_id INTEGER NOT NULL PRIMARY KEY,
    author_id BIGINT NOT NULL
);


-- Down migration

DROP TABLE IF EXISTS friends_vk_bot.memes CASCADE;
