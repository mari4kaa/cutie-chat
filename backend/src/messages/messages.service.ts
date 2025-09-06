import { Injectable } from '@nestjs/common';
import { ChatMessage } from '../common/types';

@Injectable()
export class MessagesService {
  private messages: ChatMessage[] = [];
  private idSeq = 1;

  add(from: string, to: string, text: string): ChatMessage {
    const msg: ChatMessage = {
      id: this.idSeq++,
      from,
      to,
      text,
      timestamp: Date.now(),
    };
    this.messages.push(msg);
    return msg;
  }

  conversation(a: string, b: string): ChatMessage[] {
    return this.messages
      .filter(
        (m) => (m.from === a && m.to === b) || (m.from === b && m.to === a),
      )
      .sort((x, y) => x.timestamp - y.timestamp);
  }

  all(): ChatMessage[] {
    return this.messages;
  }

  delete(id: number, requester: string): ChatMessage | null {
    const idx = this.messages.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    const msg = this.messages[idx];
    if (msg.from !== requester) {
      throw new Error('Not allowed to delete this message');
    }
    this.messages.splice(idx, 1);
    return msg;
  }
}
