import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AnalyzeRequest } from "@shared";
import { EmsService } from "./EmsService";

@ApiTags("EMS Analysis")
@Controller()
export class EmsController {
  constructor(private readonly emsService: EmsService) {}

  @ApiOperation({ summary: "Collect upstream results and start EMS analysis" })
  @ApiResponse({
    status: 202,
    description:
      "Upstream result accepted; EMS starts when all dependencies arrive",
  })
  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  analyze(@Body() body: AnalyzeRequest) {
    this.emsService.collect(body);

    return {
      accepted: true,
      runId: body.runId,
    };
  }
}
