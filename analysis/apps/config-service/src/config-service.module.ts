import { Module } from '@nestjs/common';
import { ConfigServiceController } from './config-service.controller';
import { ConfigServiceService } from './config-service.service';

@Module({
  imports: [],
  controllers: [ConfigServiceController],
  providers: [ConfigServiceService],
})
export class ConfigServiceModule {}
