-- Up migration

INSERT INTO friends_vk_bot.state (key, value) VALUES ('absent_holidays_phrases', 'Сегодня праздников нет 😞');


-- Down migration

DELETE FROM friends_vk_bot.state WHERE key = 'absent_holidays_phrases';
