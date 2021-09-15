-- Up migration

ALTER TABLE friends_vk_bot.words
    ADD COLUMN approved BOOLEAN NOT NULL DEFAULT true;


-- Down migration

ALTER TABLE friends_vk_bot.words
    DROP COLUMN approved;

