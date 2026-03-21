export type AiChatEventType =
  | 'chat_opened'
  | 'chat_closed'
  | 'message_sent'
  | 'response_received'
  | 'suggestion_clicked'
  | 'message_rated'
  | 'error'

export interface AiChatEvent {
  type: AiChatEventType
  data: Record<string, unknown>
  timestamp: Date
}
