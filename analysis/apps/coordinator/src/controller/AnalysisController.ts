import { randomUUID } from "node:crypto";
import { Body, Controller, Param, Post, Sse } from "@nestjs/common";
import { AnalyzeRequest, StartAnalysisRequest } from "@shared";
import { map, Observable } from "rxjs";
import { ClusterGateway } from "../gateway/ClusterGateway";
import { AnalysisService } from "../service/AnalysisService";

@Controller("analysis")
export class AnalysisController {
  constructor(
    private analysisService: AnalysisService,
    private clusterGateway: ClusterGateway,
  ) {}

  @Post("start")
  async start(@Body() body: StartAnalysisRequest) {
    const config = await this.clusterGateway.getConfig(body.configId);

    const runId = randomUUID();
    this.analysisService.createRun(runId, config);

    const request: AnalyzeRequest = { runId, config };
    this.clusterGateway.startFluids(request);

    return { runId };
  }

  @Post(":runId/retry/:cluster")
  retry(@Param("runId") runId: string, @Param("cluster") cluster: string) {
    return this.clusterGateway.retry(runId, cluster);
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
