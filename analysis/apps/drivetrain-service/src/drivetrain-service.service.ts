import { Injectable } from '@nestjs/common';

@Injectable()
export class DrivetrainServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
