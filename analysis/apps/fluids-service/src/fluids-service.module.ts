import { Module } from '@nestjs/common';
import { FluidsServiceController } from './fluids-service.controller';
import { FluidsServiceService } from './fluids-service.service';

@Module({
  imports: [],
  controllers: [FluidsServiceController],
  providers: [FluidsServiceService],
})
export class FluidsServiceModule {}
