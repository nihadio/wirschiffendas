import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { AnalyzeRequest, RetryRequest, SimulationService } from "@shared";
import { EmsService } from "../service/EmsService";

@Controller()
export class EmsController {
  constructor(
    private readonly emsService: EmsService,
    private readonly simulationService: SimulationService,
  ) {}

  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    this.simulationService.assertUp();

    this.emsService.analyze(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }

  @Post("retry/:runId")
  @HttpCode(HttpStatus.ACCEPTED)
  retry(@Param("runId") runId: string, @Body() body: RetryRequest) {
    this.simulationService.assertUp();

    this.emsService.retry(runId, body.config);

    return {
      accepted: true,
      runId,
    };
  }
}
