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
}
