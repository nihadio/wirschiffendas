import { Injectable } from '@nestjs/common';

@Injectable()
export class FluidsServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
