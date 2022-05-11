-- Up migration

DROP TABLE IF EXISTS friends_vk_bot.handled_messages CASCADE;


-- Down migration

CREATE TABLE IF NOT EXISTS friends_vk_bot.handled_messages
(
    conversation_message_id INTEGER NOT NULL PRIMARY KEY
);
