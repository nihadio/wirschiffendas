import { Controller, Get } from '@nestjs/common';
import { ConfigServiceService } from './config-service.service';

@Controller()
export class ConfigServiceController {
  constructor(private readonly configServiceService: ConfigServiceService) {}

  @Get()
  getHello(): string {
    return this.configServiceService.getHello();
  }
}
