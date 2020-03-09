-- Up migration

DELETE FROM friends_vk_bot.state WHERE key = 'state';
DELETE FROM friends_vk_bot.state WHERE key = 'answer';


-- Down migration

INSERT INTO friends_vk_bot.state (key, value) VALUES ('state', 'idle');
INSERT INTO friends_vk_bot.state (key, value) VALUES ('answer', '');
