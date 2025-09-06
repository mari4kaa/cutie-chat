import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  list() {
    return this.users.all();
  }

  @Post()
  create(@Body() body: { username: string }) {
    return this.users.add(body.username);
  }
}
