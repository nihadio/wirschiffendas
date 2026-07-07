import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AnalyzeRequest, SimulationStateService } from "@shared";
import { EmsService } from "../service/EmsService";

@ApiTags("EMS Analysis")
@Controller()
export class EmsController {
  constructor(
    private readonly emsService: EmsService,
    private readonly simulationState: SimulationStateService,
  ) {}

  @ApiOperation({ summary: "Collect upstream results and start EMS analysis" })
  @ApiResponse({
    status: 202,
    description:
      "Upstream result accepted; EMS starts when all dependencies arrive",
  })
  @ApiResponse({ status: 503, description: "Service is simulated down" })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    this.simulationState.assertUp();

    this.emsService.collect(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
