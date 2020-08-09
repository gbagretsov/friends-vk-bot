-- Up migration

ALTER TABLE friends_vk_bot.custom_reactions
    ADD COLUMN additional_probability SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE friends_vk_bot.custom_reactions
    RENAME COLUMN probability TO base_probability;


-- Down migration

ALTER TABLE friends_vk_bot.custom_reactions
    DROP COLUMN additional_probability;
ALTER TABLE friends_vk_bot.custom_reactions
    RENAME COLUMN base_probability TO probability;
