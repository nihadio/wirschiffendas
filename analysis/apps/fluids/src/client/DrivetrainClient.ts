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
export class DrivetrainClient {
  constructor(
    private kafkaClient: KafkaClient,
    private httpClient: HttpClient,
    private emsClient: EmsClient,
  ) {}

  @CircuitBreaker("fluids->drivetrain", "onUnreachable")
  analyze(request: AnalyzeRequest) {
    return this.httpClient.post(`${ENV.urls.drivetrain}/analyze`, request);
  }

  protected onUnreachable(request: AnalyzeRequest) {
    this.kafkaClient.emitStatus({
      runId: request.runId,
      cluster: Cluster.DRIVETRAIN,
      status: AlgorithmStatus.FAILED,
    });

    void this.emsClient.analyze({
      runId: request.runId,
      config: request.config,
      upstreamCluster: Cluster.DRIVETRAIN,
      upstreamFailed: true,
    });
  }
}
