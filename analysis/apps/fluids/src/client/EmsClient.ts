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
export class EmsClient {
  constructor(
    private kafkaClient: KafkaClient,
    private httpClient: HttpClient,
  ) {}

  @CircuitBreaker("fluids->ems", "onUnreachable")
  analyze(request: AnalyzeRequest) {
    return this.httpClient.post(`${ENV.urls.ems}/analyze`, request);
  }

  protected onUnreachable(request: AnalyzeRequest) {
    this.kafkaClient.emitStatus({
      runId: request.runId,
      cluster: Cluster.EMS,
      status: AlgorithmStatus.FAILED,
    });
  }
}
