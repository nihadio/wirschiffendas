import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { AnalyzeRequest, RetryRequest, SimulationService } from "@shared";
import { MechanicalService } from "../service/MechanicalService";

@Controller()
export class MechanicalController {
  constructor(
    private readonly mechanicalService: MechanicalService,
    private readonly simulationService: SimulationService,
  ) {}

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

  @Post("retry/:runId")
  @HttpCode(HttpStatus.ACCEPTED)
  retry(@Param("runId") runId: string, @Body() body: RetryRequest) {
    this.simulationService.assertUp();

    void this.mechanicalService.retry(runId, body.config);

    return {
      accepted: true,
      runId,
    };
  }
}
