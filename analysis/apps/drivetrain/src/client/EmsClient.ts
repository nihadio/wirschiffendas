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
export class EmsClient implements IAnalyze {
  constructor(
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    private httpClient: HttpClient,
  ) {}

  @CircuitBreaker("drivetrain->ems", "onEmsUnreachable")
  analyze(request: AnalyzeRequest) {
    return this.httpClient.post<AnalyzeAccepted>(
      `${ENV.urls.ems}/analyze`,
      request,
    );
  }

  protected onEmsUnreachable(request: AnalyzeRequest) {
    this.eventPublisher.emitStatus({
      runId: request.runId,
      cluster: Cluster.EMS,
      status: AlgorithmStatus.FAILED,
    });
  }
}
