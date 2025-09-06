import { Injectable } from '@nestjs/common';
import { ChatMessage } from '../common/types';

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessagesService {
  private messages: ChatMessage[] = [];

  add(from: string, to: string, text: string): ChatMessage {
    const msg: ChatMessage = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      id: uuidv4() as string,
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

  delete(id: string, requester: string): ChatMessage | null {
    const msg = this.messages.find((m) => m.id === id);
    if (!msg) return null;
    if (msg.from !== requester) {
      throw new Error('Not allowed to delete this message');
    }

    msg.text = '';
    msg.deleted = true;

    return msg;
  }
}
