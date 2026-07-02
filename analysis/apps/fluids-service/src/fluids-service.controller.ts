import { Controller, Get } from '@nestjs/common';
import { FluidsServiceService } from './fluids-service.service';

@Controller()
export class FluidsServiceController {
  constructor(private readonly fluidsServiceService: FluidsServiceService) {}

  @Get()
  getHello(): string {
    return this.fluidsServiceService.getHello();
  }
}
