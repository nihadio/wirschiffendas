import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MechanicalService } from "./MechanicalService";
import { AnalyzeRequest } from "@shared";

@ApiTags("Mechanical Analysis")
@Controller()
export class MechanicalController {
  constructor(private readonly mechanicalService: MechanicalService) {}

  @ApiOperation({ summary: "Start mechanical analysis" })
  @ApiResponse({ status: 202, description: "Analysis started in background" })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    void this.mechanicalService.run(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
