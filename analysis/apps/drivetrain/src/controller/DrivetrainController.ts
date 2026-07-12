import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AnalyzeRequest, SimulationService } from "@shared";
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
}
