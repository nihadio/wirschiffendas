import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AnalyzeRequest, SimulationService } from "@shared";
import { FluidsService } from "../service/FluidsService";

@Controller()
export class FluidsController {
  constructor(
    private readonly fluidsService: FluidsService,
    private readonly simulationService: SimulationService,
  ) {}

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
