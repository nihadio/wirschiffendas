import { Controller, Get, Post } from "@nestjs/common";
import { SimulationService } from "./SimulationService";

@Controller("simulation")
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get("status")
  getStatus() {
    return this.simulationService.getStatus();
  }

  @Post("down")
  down() {
    this.simulationService.markDown();

    return this.simulationService.getStatus();
  }

  @Post("up")
  up() {
    this.simulationService.markUp();

    return this.simulationService.getStatus();
  }
}
