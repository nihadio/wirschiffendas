import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DrivetrainService } from "./DrivetrainService";
import { AnalyzeRequest, SimulationStateService } from "@shared";

@ApiTags("Drivetrain Analysis")
@Controller()
export class DrivetrainController {
  constructor(
    private readonly drivetrainService: DrivetrainService,
    private readonly simulationState: SimulationStateService,
  ) {}

  @ApiOperation({ summary: "Start drivetrain analysis" })
  @ApiResponse({ status: 202, description: "Analysis started in background" })
  @ApiResponse({ status: 503, description: "Service is simulated down" })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    this.simulationState.assertUp();

    void this.drivetrainService.run(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
