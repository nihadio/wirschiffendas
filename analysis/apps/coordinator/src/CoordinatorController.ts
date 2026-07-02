import { Controller, Get } from "@nestjs/common";
import { CoordinatorService } from "./CoordinatorService";

@Controller()
export class CoordinatorController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Get()
  getHello(): string {
    return this.coordinatorService.getHello();
  }
}
