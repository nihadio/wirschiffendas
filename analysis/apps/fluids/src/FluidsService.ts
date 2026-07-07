import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ClientKafka } from "@nestjs/microservices";
import {
  ALGORITHM_DURATION_MS,
  AlgorithmStatus,
  AnalysisResult,
  AnalyzeRequest,
  buildFailedResults,
  Cluster,
  CONFIG,
  createCircuitBreaker,
  EQUIPMENT_BY_CLUSTER,
  EquipmentResult,
  KAFKA_CLIENT,
  KafkaTopics,
} from "@shared";
import type CircuitBreaker from "opossum";
import { firstValueFrom } from "rxjs";

@Injectable()
export class FluidsService implements OnModuleInit {
  private readonly cluster = Cluster.FLUIDS;
  private readonly equipments = EQUIPMENT_BY_CLUSTER[Cluster.FLUIDS];

  private readonly drivetrainBreaker: CircuitBreaker<[AnalyzeRequest]>;
  private readonly mechanicalBreaker: CircuitBreaker<[AnalyzeRequest]>;
  private readonly emsBreaker: CircuitBreaker<[AnalyzeRequest]>;

  constructor(
    @Inject(KAFKA_CLIENT) private kafka: ClientKafka,
    @Inject(HttpService) private httpService: HttpService,
  ) {
    this.emsBreaker = createCircuitBreaker(
      "fluids->ems",
      (request: AnalyzeRequest) =>
        firstValueFrom(
          this.httpService.post(`${CONFIG.env.urls.ems}/analyze`, request),
        ),
      (request: AnalyzeRequest) => this.emitFailure(request, Cluster.EMS),
    );

    this.drivetrainBreaker = createCircuitBreaker(
      "fluids->drivetrain",
      (request: AnalyzeRequest) =>
        firstValueFrom(
          this.httpService.post(
            `${CONFIG.env.urls.drivetrain}/analyze`,
            request,
          ),
        ),
      (request: AnalyzeRequest) =>
        this.failCluster(request, Cluster.DRIVETRAIN),
    );

    this.mechanicalBreaker = createCircuitBreaker(
      "fluids->mechanical",
      (request: AnalyzeRequest) =>
        firstValueFrom(
          this.httpService.post(
            `${CONFIG.env.urls.mechanical}/analyze`,
            request,
          ),
        ),
      (request: AnalyzeRequest) =>
        this.failCluster(request, Cluster.MECHANICAL),
    );
  }

  async onModuleInit() {
    await this.kafka.connect();
  }

  async run(request: AnalyzeRequest) {
    const base = {
      runId: request.runId,
      cluster: this.cluster,
    };

    this.kafka.emit(KafkaTopics.STATUS, {
      ...base,
      status: AlgorithmStatus.RUNNING,
    });

    await new Promise((resolve) => setTimeout(resolve, ALGORITHM_DURATION_MS));

    const results: EquipmentResult[] = this.equipments.map((equipment) => ({
      equipment,
      result: AnalysisResult.OK,
    }));

    this.kafka.emit(KafkaTopics.RESULT, {
      ...base,
      results,
    });

    this.kafka.emit(KafkaTopics.STATUS, {
      ...base,
      status: AlgorithmStatus.READY,
    });

    const next = {
      runId: request.runId,
      config: request.config,
    };

    void this.drivetrainBreaker.fire(next);
    void this.mechanicalBreaker.fire(next);
  }

  // the dead cluster cannot report its own failure, so the caller does it:
  // mark it failed and complete the choreography towards EMS on its behalf
  private failCluster(request: AnalyzeRequest, cluster: Cluster) {
    this.emitFailure(request, cluster);

    void this.emsBreaker.fire({
      runId: request.runId,
      config: request.config,
      upstreamCluster: cluster,
      upstreamResults: buildFailedResults(cluster),
    });
  }

  private emitFailure(request: AnalyzeRequest, cluster: Cluster) {
    this.kafka.emit(KafkaTopics.STATUS, {
      runId: request.runId,
      cluster,
      status: AlgorithmStatus.FAILED,
    });

    this.kafka.emit(KafkaTopics.RESULT, {
      runId: request.runId,
      cluster,
      results: buildFailedResults(cluster),
    });
  }
}
