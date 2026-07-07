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

@Injectable()
export class MechanicalClient {
  constructor(
    private kafkaClient: KafkaClient,
    private httpClient: HttpClient,
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
  }
}
