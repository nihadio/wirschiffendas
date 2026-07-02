import { Controller, Get } from '@nestjs/common';
import { DrivetrainServiceService } from './drivetrain-service.service';

@Controller()
export class DrivetrainServiceController {
  constructor(private readonly drivetrainServiceService: DrivetrainServiceService) {}

  @Get()
  getHello(): string {
    return this.drivetrainServiceService.getHello();
  }
}
