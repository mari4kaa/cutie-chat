export interface ChatMessage {
  id: string;
  from: string; // sender username
  to: string; // recipient username
  text: string;
  timestamp: number;
  deleted?: boolean;
}
