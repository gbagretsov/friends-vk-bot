import {VkReaction} from '../VkReaction';

export type MessageReaction = {
  reacted_id: number;
  peer_id: number;
  cmid: number;
  reaction_id?: VkReaction;
};

export type VkMessageReactionEvent = {
  type: 'message_reaction_event';
  object: MessageReaction;
}
