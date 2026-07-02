import { Controller, Get } from '@nestjs/common';
import { MechanicalServiceService } from './mechanical-service.service';

@Controller()
export class MechanicalServiceController {
  constructor(private readonly mechanicalServiceService: MechanicalServiceService) {}

  @Get()
  getHello(): string {
    return this.mechanicalServiceService.getHello();
  }
}
