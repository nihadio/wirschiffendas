import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AnalyzeRequest, SimulationService } from "@shared";
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
}
