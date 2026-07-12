import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AnalyzeRequest, SimulationService } from "@shared";
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
}
