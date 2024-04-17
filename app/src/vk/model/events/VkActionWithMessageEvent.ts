export type ActionWithMessage = {
  event_id: string;
  user_id: number;
  peer_id: number;
  conversation_message_id: number;
  payload?: Record<string, unknown>;
};

export type VkActionWithMessageEvent = {
  type: 'message_event';
  object: ActionWithMessage;
}