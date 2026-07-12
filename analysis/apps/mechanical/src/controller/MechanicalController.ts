import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AnalyzeRequest, SimulationService } from "@shared";
import { MechanicalService } from "../service/MechanicalService";

@ApiTags("Mechanical Analysis")
@Controller()
export class MechanicalController {
  constructor(
    private readonly mechanicalService: MechanicalService,
    private readonly simulationService: SimulationService,
  ) {}

  @ApiOperation({ summary: "Start mechanical analysis" })
  @ApiResponse({ status: 202, description: "Analysis started in background" })
  @ApiResponse({ status: 503, description: "Service is simulated down" })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    this.simulationService.assertUp();

    void this.mechanicalService.analyze(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
