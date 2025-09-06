import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users = new Set<string>();

  add(username: string) {
    const name = username.trim();
    if (!name) throw new BadRequestException('Username required');
    if (this.users.has(name))
      throw new BadRequestException('Username already exists');
    this.users.add(name);
    return { username: name };
  }

  ensureExists(username: string) {
    if (!this.users.has(username)) {
      this.users.add(username);
    }
  }

  all() {
    return Array.from(this.users).sort();
  }
}
