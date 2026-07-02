import { Module } from '@nestjs/common';
import { MechanicalServiceController } from './mechanical-service.controller';
import { MechanicalServiceService } from './mechanical-service.service';

@Module({
  imports: [],
  controllers: [MechanicalServiceController],
  providers: [MechanicalServiceService],
})
export class MechanicalServiceModule {}
