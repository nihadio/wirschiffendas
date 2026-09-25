import { Controller, Get, Post } from "@nestjs/common";
import type { ISimulation, SimulationStatus } from "../contracts/simulation";
import { SimulationService } from "./SimulationService";

@Controller("simulation")
export class SimulationController implements ISimulation {
  constructor(private readonly simulationService: SimulationService) {}

  @Get("status")
  getStatus(): SimulationStatus {
    return this.simulationService.getStatus();
  }

  @Post("down")
  down(): SimulationStatus {
    this.simulationService.markDown();

    return this.simulationService.getStatus();
  }

  @Post("up")
  up(): SimulationStatus {
    this.simulationService.markUp();

    return this.simulationService.getStatus();
  }
}
