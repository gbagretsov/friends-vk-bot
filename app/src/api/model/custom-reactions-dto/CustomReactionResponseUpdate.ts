import {CustomReactionResponseDto} from './CustomReactionResponseDto';

export type CustomReactionResponseUpdate = CustomReactionResponseDto & {
  deleted: boolean;
}
