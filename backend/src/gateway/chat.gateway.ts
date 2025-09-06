import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { MessagesService } from '../messages/messages.service';

@WebSocketGateway({ cors: { origin: ['http://localhost:3000'] } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private users: UsersService,
    private messages: MessagesService,
  ) {}

  @WebSocketServer()
  server: Server;

  // socket.id -> username
  private sockets = new Map<string, string>();
  // username -> set of socket ids (support multiple tabs)
  private online = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    client.emit('hello', { message: 'connected' });
  }

  handleDisconnect(client: Socket) {
    const username = this.sockets.get(client.id);
    if (username) {
      const set = this.online.get(username);
      set?.delete(client.id);
      if (set && set.size === 0) {
        this.online.delete(username);
      }
      this.sockets.delete(client.id);
    }
  }

  @SubscribeMessage('register')
  register(
    @MessageBody() body: { username: string },
    @ConnectedSocket() client: Socket,
  ) {
    const name = (body?.username || '').trim();
    if (!name) {
      return client.emit('register_error', { error: 'Username required' });
    }

    try {
      this.users.ensureExists(name);

      this.sockets.set(client.id, name);
      let set = this.online.get(name);
      if (!set) {
        set = new Set();
        this.online.set(name, set);
      }
      set.add(client.id);

      client.emit('registered', { username: name });
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : 'Registration failed';
      client.emit('register_error', { error: errorMessage });
    }
  }

  @SubscribeMessage('send_message')
  send(
    @MessageBody() body: { to: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const from = this.sockets.get(client.id);
    if (!from) return client.emit('send_error', { error: 'Not registered' });

    const to = (body?.to || '').trim();
    const text = (body?.text || '').trim();
    if (!to || !text) {
      return client.emit('send_error', {
        error: 'Recipient and text required',
      });
    }

    const msg = this.messages.add(from, to, text);

    // Notify sender
    client.emit('new_message', msg);

    // Deliver to recipient via the server
    const recSockets = this.online.get(to);
    recSockets?.forEach((sid) => this.server.to(sid).emit('new_message', msg));
  }
}
