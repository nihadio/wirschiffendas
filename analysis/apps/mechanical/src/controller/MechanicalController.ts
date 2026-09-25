import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  type AnalyzeAccepted,
  AnalyzeRequest,
  type IAnalyze,
  SimulationService,
} from "@shared";
import { MechanicalService } from "../service/MechanicalService";

@Controller()
export class MechanicalController implements IAnalyze {
  constructor(
    private readonly mechanicalService: MechanicalService,
    private readonly simulationService: SimulationService,
  ) {}

  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest): Promise<AnalyzeAccepted> {
    this.simulationService.assertUp();

    void this.mechanicalService.analyze(body);

    return Promise.resolve({
      accepted: true,
      runId: body.runId,
    });
  }
}
