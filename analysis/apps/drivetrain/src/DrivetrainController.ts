import { Controller, Get } from '@nestjs/common';
import { DrivetrainService } from './DrivetrainService';

@Controller()
export class DrivetrainController {
  constructor(private readonly drivetrainService: DrivetrainService) {}

  @Get()
  getHello(): string {
    return this.drivetrainService.getHello();
  }
}
