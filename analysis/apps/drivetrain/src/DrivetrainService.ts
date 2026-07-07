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
export class DrivetrainService implements OnModuleInit {
  private readonly cluster = Cluster.DRIVETRAIN;
  private readonly equipments = EQUIPMENT_BY_CLUSTER[Cluster.DRIVETRAIN];

  private readonly emsBreaker: CircuitBreaker<[AnalyzeRequest]>;

  constructor(
    @Inject(KAFKA_CLIENT) private kafka: ClientKafka,
    @Inject(HttpService) private httpService: HttpService,
  ) {
    this.emsBreaker = createCircuitBreaker(
      "drivetrain->ems",
      (request: AnalyzeRequest) =>
        firstValueFrom(
          this.httpService.post(`${CONFIG.env.urls.ems}/analyze`, request),
        ),
      (request: AnalyzeRequest) => this.emitEmsFailure(request),
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

    void this.emsBreaker.fire({
      runId: request.runId,
      config: request.config,
      upstreamCluster: this.cluster,
      upstreamResults: results,
    });
  }

  private emitEmsFailure(request: AnalyzeRequest) {
    this.kafka.emit(KafkaTopics.STATUS, {
      runId: request.runId,
      cluster: Cluster.EMS,
      status: AlgorithmStatus.FAILED,
    });

    this.kafka.emit(KafkaTopics.RESULT, {
      runId: request.runId,
      cluster: Cluster.EMS,
      results: buildFailedResults(Cluster.EMS),
    });
  }
}
