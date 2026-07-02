import { Injectable } from '@nestjs/common';

@Injectable()
export class EmsServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
