import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
