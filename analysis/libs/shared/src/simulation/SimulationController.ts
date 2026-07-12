import { Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SimulationService } from "./SimulationService";

@ApiTags("Failure Simulation")
@Controller("simulation")
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @ApiOperation({ summary: "Current simulation status of this service" })
  @ApiResponse({
    status: 200,
    description: "Current service status: up or down",
  })
  @Get("status")
  getStatus() {
    return this.simulationService.getStatus();
  }

  @ApiOperation({ summary: "Simulate this service being down" })
  @ApiResponse({ status: 201, description: "Service now rejects /analyze" })
  @Post("down")
  down() {
    this.simulationService.markDown();

    return this.simulationService.getStatus();
  }

  @ApiOperation({ summary: "Bring the service back up" })
  @ApiResponse({ status: 201, description: "Service accepts /analyze again" })
  @Post("up")
  up() {
    this.simulationService.markUp();

    return this.simulationService.getStatus();
  }
}
