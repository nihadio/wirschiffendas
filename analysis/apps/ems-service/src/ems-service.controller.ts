import { Controller, Get } from '@nestjs/common';
import { EmsServiceService } from './ems-service.service';

@Controller()
export class EmsServiceController {
  constructor(private readonly emsServiceService: EmsServiceService) {}

  @Get()
  getHello(): string {
    return this.emsServiceService.getHello();
  }
}
