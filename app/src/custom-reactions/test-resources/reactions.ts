import {CustomReaction} from '../model/CustomReaction';
import {CustomReactionType} from '../model/CustomReactionType';

export const oneTextReaction: CustomReaction[] = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: CustomReactionType.TEXT,
    content: 'This is custom reaction'
  },
];

export const oneTextReactionWithAdditionalProbability: CustomReaction[] = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 20,
    type: CustomReactionType.TEXT,
    content: 'This is custom reaction'
  },
];

export const twoTextReactions: CustomReaction[] = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: CustomReactionType.TEXT,
    content: 'This is custom reaction 1'
  },
  {
    id: 2,
    baseProbability: 50,
    additionalProbability: 0,
    type: CustomReactionType.TEXT,
    content: 'This is custom reaction 2'
  },
];

export const mixedSuccessfulAndFailedRandomCheck: CustomReaction[] = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 20,
    type: CustomReactionType.TEXT,
    content: 'This is custom reaction 1'
  },
  {
    id: 2,
    baseProbability: 60,
    additionalProbability: 0,
    type: CustomReactionType.TEXT,
    content: 'This is custom reaction 2'
  },
  {
    id: 3,
    baseProbability: 10,
    additionalProbability: 0,
    type: CustomReactionType.TEXT,
    content: 'This is custom reaction 1'
  },
  {
    id: 4,
    baseProbability: 20,
    additionalProbability: 5,
    type: CustomReactionType.TEXT,
    content: 'This is custom reaction 2'
  },
];

export const onePictureReaction: CustomReaction[] = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: CustomReactionType.PICTURE,
    content: 'https://drive.google.com/file/d/1jJb8Clqoza_BDBhkiyv7Kqj9EUwAd8SE/view?usp=sharing'
  },
];

export const oneYouTubeVideoReaction: CustomReaction[] = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: CustomReactionType.YOUTUBE_VIDEO,
    content: 'TU-xo3Pe2_c'
  },
];

export const oneStickerReaction: CustomReaction[] = [
  {
    id: 1,
    baseProbability: 50,
    additionalProbability: 0,
    type: CustomReactionType.STICKER,
    content: '1234'
  },
];

