import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AnalyzeRequest, SimulationStateService } from "@shared";
import { EmsService } from "./EmsService";

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

  @ApiOperation({ summary: "Reset cached upstream results for a run" })
  @ApiResponse({ status: 200, description: "Cached upstream state cleared" })
  @Delete("analyze/:runId")
  reset(@Param("runId") runId: string) {
    this.emsService.reset(runId);

    return {
      accepted: true,
      runId,
    };
  }
}
