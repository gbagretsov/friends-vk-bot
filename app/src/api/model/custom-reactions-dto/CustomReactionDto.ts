import {CustomReactionPhraseDto } from './CustomReactionPhraseDto';
import {CustomReactionStickerDto} from './CustomReactionStickerDto';
import {CustomReactionResponseDto} from './CustomReactionResponseDto';


export type CustomReactionDto = {
  id: number,
  probability: number,
  phrases: CustomReactionPhraseDto[],
  stickers: CustomReactionStickerDto[],
  responses: CustomReactionResponseDto[],
}
