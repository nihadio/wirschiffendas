import { randomUUID } from "node:crypto";
import { Body, Controller, Param, Post, Sse } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AnalyzeRequest, StartAnalysisRequest } from "@shared";
import { map, Observable } from "rxjs";
import { ClusterGateway } from "../gateway/ClusterGateway";
import { AnalysisService } from "../service/AnalysisService";

@ApiTags("Analysis Coordinator")
@Controller("analysis")
export class AnalysisController {
  constructor(
    private analysisService: AnalysisService,
    private clusterGateway: ClusterGateway,
  ) {}

  @ApiOperation({ summary: "Start a new analysis run" })
  @ApiResponse({ status: 201, description: "Analysis started, returns runId" })
  @ApiResponse({ status: 503, description: "Config service unavailable" })
  @Post("start")
  async start(@Body() body: StartAnalysisRequest) {
    const config = await this.clusterGateway.getConfig(body.configId);

    const runId = randomUUID();
    this.analysisService.createRun(runId, config);

    const request: AnalyzeRequest = { runId, config, upstreamResults: [] };
    this.clusterGateway.startFluids(request);

    return { runId };
  }

  @ApiOperation({ summary: "Retry a single cluster of an existing run" })
  @ApiResponse({ status: 201, description: "Retry dispatched" })
  @ApiResponse({ status: 404, description: "Run not found" })
  @Post(":runId/retry/:cluster")
  retry(@Param("runId") runId: string, @Param("cluster") cluster: string) {
    return this.clusterGateway.retry(runId, cluster);
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
