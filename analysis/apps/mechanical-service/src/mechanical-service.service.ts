import { Injectable } from '@nestjs/common';

@Injectable()
export class MechanicalServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
