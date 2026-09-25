import { randomUUID } from "node:crypto";
import { Body, Controller, Param, Post, Sse } from "@nestjs/common";
import {
  type AnalysisStarted,
  type IAnalysis,
  type IStream,
  type RetryAccepted,
  StartAnalysisRequest,
} from "@shared";
import { map, Observable } from "rxjs";
import { ClusterGateway } from "../gateway/ClusterGateway";
import { AnalysisService } from "../service/AnalysisService";

@Controller("analysis")
export class AnalysisController implements IAnalysis, IStream {
  constructor(
    private analysisService: AnalysisService,
    private clusterGateway: ClusterGateway,
  ) {}

  @Post("start")
  async start(@Body() body: StartAnalysisRequest): Promise<AnalysisStarted> {
    await this.clusterGateway.assertConfigExists(body.configId);

    const runId = randomUUID();
    this.analysisService.createRun(runId);
    this.clusterGateway.startFluids({ runId });

    return { runId };
  }

  @Post(":runId/retry/:cluster")
  retry(
    @Param("runId") runId: string,
    @Param("cluster") cluster: string,
  ): RetryAccepted {
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
