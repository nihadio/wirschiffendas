import { randomUUID } from "node:crypto";
import { Body, Controller, Param, Post, Sse } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AnalyzeRequest, CONFIG, OptionalEquipmentConfig } from "@shared";
import { firstValueFrom, map, Observable } from "rxjs";
import { AnalysisService } from "./AnalysisService";

@Controller("analysis")
export class AnalysisController {
  constructor(
    private analysisService: AnalysisService,
    private httpService: HttpService,
  ) {}

  @Post("start")
  async start(@Body() body: { configId: string }) {
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
