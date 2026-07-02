import { Module } from '@nestjs/common';
import { DrivetrainServiceController } from './drivetrain-service.controller';
import { DrivetrainServiceService } from './drivetrain-service.service';

@Module({
  imports: [],
  controllers: [DrivetrainServiceController],
  providers: [DrivetrainServiceService],
})
export class DrivetrainServiceModule {}
