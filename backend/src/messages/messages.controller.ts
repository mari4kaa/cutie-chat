import { Controller, Get, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Get()
  convo(@Query('userA') userA: string, @Query('userB') userB: string) {
    if (!userA || !userB) return [];
    return this.messages.conversation(userA, userB);
  }
}
