export interface ChatMessage {
  id: number;
  from: string; // sender username
  to: string; // recipient username
  text: string;
  timestamp: number;
}
