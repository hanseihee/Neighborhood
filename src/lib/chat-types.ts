export interface ChatMessage {
  id: string;
  nickname: string;
  message: string;
  created_at: string;
  user_hash?: string;
}
