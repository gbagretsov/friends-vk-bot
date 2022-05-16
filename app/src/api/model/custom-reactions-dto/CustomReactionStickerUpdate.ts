import {CustomReactionStickerDto} from './CustomReactionStickerDto';

export type CustomReactionStickerUpdate = CustomReactionStickerDto & {
  deleted: boolean;
}
