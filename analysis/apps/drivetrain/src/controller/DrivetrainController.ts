import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { AnalyzeRequest, RetryRequest, SimulationService } from "@shared";
import { DrivetrainService } from "../service/DrivetrainService";

@Controller()
export class DrivetrainController {
  constructor(
    private readonly drivetrainService: DrivetrainService,
    private readonly simulationService: SimulationService,
  ) {}

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

  @Post("retry/:runId")
  @HttpCode(HttpStatus.ACCEPTED)
  retry(@Param("runId") runId: string, @Body() body: RetryRequest) {
    this.simulationService.assertUp();

    void this.drivetrainService.retry(runId, body.config);

    return {
      accepted: true,
      runId,
    };
  }
}
