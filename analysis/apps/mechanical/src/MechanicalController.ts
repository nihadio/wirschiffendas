import { Controller, Get } from "@nestjs/common";
import { MechanicalService } from "./MechanicalService";

@Controller()
export class MechanicalController {
  constructor(private readonly mechanicalService: MechanicalService) {}

  @Get()
  getHello(): string {
    return this.mechanicalService.getHello();
  }
}
