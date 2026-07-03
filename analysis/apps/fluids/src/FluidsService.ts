import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ClientKafka } from "@nestjs/microservices";
import {
  AlgorithmStatus,
  AnalysisResult,
  AnalyzeRequest,
  Cluster,
  CONFIG,
  EQUIPMENT_BY_CLUSTER,
  EquipmentResult,
  KAFKA_CLIENT,
  KafkaTopics,
} from "@shared";
import { firstValueFrom } from "rxjs";

@Injectable()
export class FluidsService implements OnModuleInit {
  private readonly cluster = Cluster.FLUIDS;
  private readonly equipments = EQUIPMENT_BY_CLUSTER[Cluster.FLUIDS];

  constructor(
    @Inject(KAFKA_CLIENT) private kafka: ClientKafka,
    @Inject(HttpService) private httpService: HttpService,
  ) {}

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

    await new Promise((resolve) => setTimeout(resolve, 20_000));

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

    void firstValueFrom(
      this.httpService.post(`${CONFIG.env.urls.drivetrain}/analyze`, next),
    );

    void firstValueFrom(
      this.httpService.post(`${CONFIG.env.urls.mechanical}/analyze`, next),
    );
  }
}
