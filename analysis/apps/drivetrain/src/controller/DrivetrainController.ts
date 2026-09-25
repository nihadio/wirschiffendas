import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  type AnalyzeAccepted,
  AnalyzeRequest,
  type IAnalyze,
  SimulationService,
} from "@shared";
import { DrivetrainService } from "../service/DrivetrainService";

@Controller()
export class DrivetrainController implements IAnalyze {
  constructor(
    private readonly drivetrainService: DrivetrainService,
    private readonly simulationService: SimulationService,
  ) {}

  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest): Promise<AnalyzeAccepted> {
    this.simulationService.assertUp();

    void this.drivetrainService.analyze(body);

    return Promise.resolve({
      accepted: true,
      runId: body.runId,
    });
  }
}
