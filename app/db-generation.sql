CREATE SCHEMA friends_vk_bot;


CREATE TABLE IF NOT EXISTS friends_vk_bot.words
(
	id SERIAL NOT NULL
		CONSTRAINT actors_pkey
			PRIMARY KEY,
	name TEXT NOT NULL
		CONSTRAINT unique_name
			UNIQUE
);

INSERT INTO friends_vk_bot.words (name) VALUES ('бот');


CREATE TABLE IF NOT EXISTS friends_vk_bot.state
(
	key TEXT NOT NULL
		CONSTRAINT state_pkey
			PRIMARY KEY,
	value TEXT
);

INSERT INTO friends_vk_bot.state (key, value) VALUES ('ads', '');
INSERT INTO friends_vk_bot.state (key, value) VALUES ('state', 'idle');
INSERT INTO friends_vk_bot.state (key, value) VALUES ('answer', '');


