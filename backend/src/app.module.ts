import { Module } from '@nestjs/common';
import { ChatGateway } from './gateway/chat.gateway';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { MessagesController } from './messages/messages.controller';
import { MessagesService } from './messages/messages.service';

@Module({
  imports: [],
  providers: [ChatGateway, UsersService, MessagesService],
  controllers: [UsersController, MessagesController],
})
export class AppModule {}
