import { Controller, Get } from "@nestjs/common";
import { EmsService } from "./EmsService";

@Controller()
export class EmsController {
  constructor(private readonly emsService: EmsService) {}

  @Get()
  getHello(): string {
    return this.emsService.getHello();
  }
}
