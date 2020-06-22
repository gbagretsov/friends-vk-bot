-- Up migration
CREATE TABLE IF NOT EXISTS friends_vk_bot.custom_reactions
(
    id SERIAL NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    probability SMALLINT NOT NULL
);

CREATE TABLE IF NOT EXISTS friends_vk_bot.stickers
(
    id SERIAL NOT NULL PRIMARY KEY,
    reaction_id INTEGER NOT NULL REFERENCES friends_vk_bot.custom_reactions(id) ON DELETE CASCADE,
    sticker_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS friends_vk_bot.phrases
(
    id SERIAL NOT NULL PRIMARY KEY,
    reaction_id INTEGER NOT NULL REFERENCES friends_vk_bot.custom_reactions(id) ON DELETE CASCADE,
    text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS friends_vk_bot.responses
(
    id SERIAL NOT NULL PRIMARY KEY,
    reaction_id INTEGER NOT NULL REFERENCES friends_vk_bot.custom_reactions(id) ON DELETE CASCADE,
    type SMALLINT NOT NULL,
    content TEXT NOT NULL
);


-- Down migration

DROP TABLE IF EXISTS friends_vk_bot.stickers CASCADE;
DROP TABLE IF EXISTS friends_vk_bot.phrases CASCADE;
DROP TABLE IF EXISTS friends_vk_bot.responses CASCADE;
DROP TABLE IF EXISTS friends_vk_bot.custom_reactions CASCADE;
