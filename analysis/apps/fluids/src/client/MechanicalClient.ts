import { Injectable } from "@nestjs/common";
import {
  AlgorithmStatus,
  AnalyzeRequest,
  CircuitBreaker,
  Cluster,
  HttpClient,
  KafkaClient,
} from "@shared";
import { ENV } from "../environment";
import { EmsClient } from "./EmsClient";

@Injectable()
export class MechanicalClient {
  constructor(
    private kafkaClient: KafkaClient,
    private httpClient: HttpClient,
    private emsClient: EmsClient,
  ) {}

  @CircuitBreaker("fluids->mechanical", "onUnreachable")
  analyze(request: AnalyzeRequest) {
    return this.httpClient.post(`${ENV.urls.mechanical}/analyze`, request);
  }

  protected onUnreachable(request: AnalyzeRequest) {
    this.kafkaClient.emitStatus({
      runId: request.runId,
      cluster: Cluster.MECHANICAL,
      status: AlgorithmStatus.FAILED,
    });

    void this.emsClient.analyze({
      runId: request.runId,
      config: request.config,
      upstreamCluster: Cluster.MECHANICAL,
      upstreamFailed: true,
    });
  }
}
