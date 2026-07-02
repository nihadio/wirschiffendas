import { Controller, Get } from '@nestjs/common';
import { FluidsService } from './FluidsService';

@Controller()
export class FluidsController {
  constructor(private readonly fluidsService: FluidsService) {}

  @Get()
  getHello(): string {
    return this.fluidsService.getHello();
  }
}
