import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AnalyzeRequest, SimulationService } from "@shared";
import { DrivetrainService } from "../service/DrivetrainService";

@ApiTags("Drivetrain Analysis")
@Controller()
export class DrivetrainController {
  constructor(
    private readonly drivetrainService: DrivetrainService,
    private readonly simulationService: SimulationService,
  ) {}

  @ApiOperation({ summary: "Start drivetrain analysis" })
  @ApiResponse({ status: 202, description: "Analysis started in background" })
  @ApiResponse({ status: 503, description: "Service is simulated down" })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    this.simulationService.assertUp();

    void this.drivetrainService.analyze(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
