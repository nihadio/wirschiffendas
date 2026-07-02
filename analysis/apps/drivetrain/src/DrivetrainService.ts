import { Injectable } from '@nestjs/common';

@Injectable()
export class DrivetrainService {
  getHello(): string {
    return 'Hello World!';
  }
}
