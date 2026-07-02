import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FluidsService } from "./FluidsService";
import { AnalyzeRequest } from "@shared";

@ApiTags("Fluids Analysis")
@Controller()
export class FluidsController {
  constructor(private readonly fluidsService: FluidsService) {}

  @ApiOperation({ summary: "Start fluids analysis" })
  @ApiResponse({ status: 202, description: "Analysis started in background" })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    void this.fluidsService.run(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
