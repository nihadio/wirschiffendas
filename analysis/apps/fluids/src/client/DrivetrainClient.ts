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
export class DrivetrainClient {
  constructor(
    private kafkaClient: KafkaClient,
    private httpClient: HttpClient,
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
  }
}
