import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  private fakeUser = {
    id: 1,
    email: 'admin@washmoney.com',
    name: 'Admin',
    tenant: {
      id: 1,
      name: 'WashMoney Matriz',
    },
  };

  validateUser(email: string, password: string) {
    if (email === 'admin@washmoney.com' && password === '123456') {
      return this.fakeUser;
    }
    return null;
  }

  getMe() {
    return this.fakeUser;
  }
}
