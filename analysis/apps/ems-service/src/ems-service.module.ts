import { Module } from '@nestjs/common';
import { EmsServiceController } from './ems-service.controller';
import { EmsServiceService } from './ems-service.service';

@Module({
  imports: [],
  controllers: [EmsServiceController],
  providers: [EmsServiceService],
})
export class EmsServiceModule {}
