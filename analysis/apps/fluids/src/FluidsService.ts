import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import {
  AlgorithmStatus,
  AnalysisResult,
  AnalyzeRequest,
  Cluster,
  EQUIPMENT_BY_CLUSTER,
  EquipmentResult,
  KafkaTopics,
} from "@shared";

@Injectable()
export class FluidsService implements OnModuleInit {
  private readonly cluster = Cluster.FLUIDS;
  private readonly equipments = EQUIPMENT_BY_CLUSTER[Cluster.FLUIDS];

  constructor(@Inject("KAFKA") private kafka: ClientKafka) {}

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
  }
}
