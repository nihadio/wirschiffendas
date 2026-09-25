import { Inject, Injectable } from "@nestjs/common";
import {
  AlgorithmStatus,
  type AnalyzeAccepted,
  AnalyzeRequest,
  CircuitBreaker,
  Cluster,
  EVENT_PUBLISHER,
  HttpClient,
  type IAnalyze,
  type IEventPublisher,
} from "@shared";
import { ENV } from "../environment";

@Injectable()
export class MechanicalClient implements IAnalyze {
  constructor(
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    private httpClient: HttpClient,
  ) {}

  @CircuitBreaker("fluids->mechanical", "onUnreachable")
  analyze(request: AnalyzeRequest) {
    return this.httpClient.post<AnalyzeAccepted>(
      `${ENV.urls.mechanical}/analyze`,
      request,
    );
  }

  protected onUnreachable(request: AnalyzeRequest) {
    this.eventPublisher.emitStatus({
      runId: request.runId,
      cluster: Cluster.MECHANICAL,
      status: AlgorithmStatus.FAILED,
    });
  }
}
