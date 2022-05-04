import {CustomReactionType} from './CustomReactionType';

export type CustomReaction = {
  id: number;
  baseProbability: number;
  additionalProbability: number;
  type: CustomReactionType;
  content: string;
}
