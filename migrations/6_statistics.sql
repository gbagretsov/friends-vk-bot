-- Up migration

CREATE TABLE IF NOT EXISTS friends_vk_bot.statistics
(
    id BIGINT NOT NULL PRIMARY KEY,
    value INTEGER NOT NULL
);

INSERT INTO friends_vk_bot.statistics (id, value) VALUES (-1, 0);
INSERT INTO friends_vk_bot.statistics (id, value) VALUES (-2, 0);
INSERT INTO friends_vk_bot.statistics (id, value) VALUES (-3, 0);
INSERT INTO friends_vk_bot.statistics (id, value) VALUES (-4, 0);
INSERT INTO friends_vk_bot.statistics (id, value) VALUES (-5, -1);

CREATE TABLE IF NOT EXISTS friends_vk_bot.handled_messages
(
    conversation_message_id INTEGER NOT NULL PRIMARY KEY
);


-- Down migration

DROP TABLE IF EXISTS friends_vk_bot.statistics CASCADE;
DROP TABLE IF EXISTS friends_vk_bot.handled_messages CASCADE;
