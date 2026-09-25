import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  type AnalyzeAccepted,
  AnalyzeRequest,
  type IAnalyze,
  SimulationService,
} from "@shared";
import { EmsService } from "../service/EmsService";

@Controller()
export class EmsController implements IAnalyze {
  constructor(
    private readonly emsService: EmsService,
    private readonly simulationService: SimulationService,
  ) {}

  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest): Promise<AnalyzeAccepted> {
    this.simulationService.assertUp();

    this.emsService.analyze(body);

    return Promise.resolve({
      accepted: true,
      runId: body.runId,
    });
  }
}
