import { randomUUID } from "node:crypto";
import { Body, Controller, Param, Post, Sse } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HttpService } from "@nestjs/axios";
import {
  AnalyzeRequest,
  CONFIG,
  OptionalEquipmentConfig,
  StartAnalysisRequest,
} from "@shared";
import { firstValueFrom, map, Observable } from "rxjs";
import { AnalysisService } from "./AnalysisService";

@ApiTags("Analysis Coordinator")
@Controller("analysis")
export class AnalysisController {
  constructor(
    private analysisService: AnalysisService,
    private httpService: HttpService,
  ) {}

  @ApiOperation({ summary: "Start a new analysis run" })
  @ApiResponse({ status: 201, description: "Analysis started, returns runId" })
  @Post("start")
  async start(@Body() body: StartAnalysisRequest) {
    const { data: config } = await firstValueFrom(
      this.httpService.get<OptionalEquipmentConfig>(
        `${CONFIG.env.urls.config}/configs/${body.configId}`,
      ),
    );

    const runId = randomUUID();
    this.analysisService.createRun(runId);

    const request: AnalyzeRequest = { runId, config, upstreamResults: [] };
    void firstValueFrom(
      this.httpService.post(`${CONFIG.env.urls.fluids}/analyze`, request),
    );

    return { runId };
  }

  @ApiOperation({ summary: "Stream analysis events via SSE" })
  @Sse(":runId/stream")
  stream(@Param("runId") runId: string): Observable<MessageEvent> {
    return this.analysisService.stream(runId).pipe(
      map(
        (event) =>
          ({
            data: event,
          }) as MessageEvent,
      ),
    );
  }
}
