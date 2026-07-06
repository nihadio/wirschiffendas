import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MechanicalService } from "./MechanicalService";
import { AnalyzeRequest, SimulationStateService } from "@shared";

@ApiTags("Mechanical Analysis")
@Controller()
export class MechanicalController {
  constructor(
    private readonly mechanicalService: MechanicalService,
    private readonly simulationState: SimulationStateService,
  ) {}

  @ApiOperation({ summary: "Start mechanical analysis" })
  @ApiResponse({ status: 202, description: "Analysis started in background" })
  @ApiResponse({ status: 503, description: "Service is simulated down" })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    this.simulationState.assertUp();

    void this.mechanicalService.run(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
