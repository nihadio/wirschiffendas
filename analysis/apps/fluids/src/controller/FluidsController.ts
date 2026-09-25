import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  type AnalyzeAccepted,
  AnalyzeRequest,
  type IAnalyze,
  SimulationService,
} from "@shared";
import { FluidsService } from "../service/FluidsService";

@Controller()
export class FluidsController implements IAnalyze {
  constructor(
    private readonly fluidsService: FluidsService,
    private readonly simulationService: SimulationService,
  ) {}

  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest): Promise<AnalyzeAccepted> {
    this.simulationService.assertUp();

    void this.fluidsService.analyze(body);

    return Promise.resolve({
      accepted: true,
      runId: body.runId,
    });
  }
}
