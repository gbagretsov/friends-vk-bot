-- Up migration

CREATE SCHEMA IF NOT EXISTS friends_vk_bot;


CREATE TABLE IF NOT EXISTS friends_vk_bot.words
(
	id SERIAL NOT NULL PRIMARY KEY,
	name TEXT NOT NULL UNIQUE
);

INSERT INTO friends_vk_bot.words (name) VALUES ('бот');


CREATE TABLE IF NOT EXISTS friends_vk_bot.state
(
	key TEXT NOT NULL PRIMARY KEY,
	value TEXT
);

INSERT INTO friends_vk_bot.state (key, value) VALUES ('ads', '');
INSERT INTO friends_vk_bot.state (key, value) VALUES ('state', 'idle');
INSERT INTO friends_vk_bot.state (key, value) VALUES ('answer', '');


CREATE TABLE IF NOT EXISTS friends_vk_bot.polls
(
	id BIGINT NOT NULL PRIMARY KEY,
	owner_id BIGINT NOT NULL
);


-- Down migration

DROP SCHEMA IF EXISTS friends_vk_bot CASCADE;

