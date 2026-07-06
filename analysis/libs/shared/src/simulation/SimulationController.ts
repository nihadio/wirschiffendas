import { Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SimulationStateService } from "./SimulationStateService";

@ApiTags("Failure Simulation")
@Controller("simulate")
export class SimulationController {
  constructor(private readonly simulationState: SimulationStateService) {}

  @ApiOperation({ summary: "Simulate this service being down" })
  @ApiResponse({ status: 201, description: "Service now rejects /analyze" })
  @Post("down")
  down() {
    this.simulationState.markDown();

    return { down: true };
  }

  @ApiOperation({ summary: "Bring the service back up" })
  @ApiResponse({ status: 201, description: "Service accepts /analyze again" })
  @Post("up")
  up() {
    this.simulationState.markUp();

    return { down: false };
  }
}
