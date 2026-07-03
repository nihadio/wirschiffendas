import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DrivetrainService } from "./DrivetrainService";
import { AnalyzeRequest } from "@shared";

@ApiTags("Drivetrain Analysis")
@Controller()
export class DrivetrainController {
  constructor(private readonly drivetrainService: DrivetrainService) {}

  @ApiOperation({ summary: "Start drivetrain analysis" })
  @ApiResponse({ status: 202, description: "Analysis started in background" })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    void this.drivetrainService.run(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
