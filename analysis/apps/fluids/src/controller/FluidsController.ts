import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AnalyzeRequest, SimulationService } from "@shared";
import { FluidsService } from "../service/FluidsService";

@ApiTags("Fluids Analysis")
@Controller()
export class FluidsController {
  constructor(
    private readonly fluidsService: FluidsService,
    private readonly simulationService: SimulationService,
  ) {}

  @ApiOperation({ summary: "Start fluids analysis" })
  @ApiResponse({ status: 202, description: "Analysis started in background" })
  @ApiResponse({ status: 503, description: "Service is simulated down" })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    this.simulationService.assertUp();

    void this.fluidsService.analyze(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
