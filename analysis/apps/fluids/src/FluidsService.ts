import { Injectable } from '@nestjs/common';

@Injectable()
export class FluidsService {
  getHello(): string {
    return 'Hello World!';
  }
}
