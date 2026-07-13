import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { isAxiosError } from "axios";
import {
  AlgorithmStatus,
  AnalyzeRequest,
  Cluster,
  createCircuitBreaker,
  KafkaClient,
  OptionalEquipmentConfig,
} from "@shared";
import type { SimulationStatus } from "@shared";
import type CircuitBreaker from "opossum";
import { AlgorithmClient } from "../client/AlgorithmClient";
import { ConfigClient } from "../client/ConfigClient";
import { SimulationClient } from "../client/SimulationClient";
import { AnalysisService } from "../service/AnalysisService";

@Injectable()
export class ClusterGateway {
  private readonly configBreaker: CircuitBreaker<
    [string],
    OptionalEquipmentConfig
  >;
  private readonly fluidsBreaker: CircuitBreaker<[AnalyzeRequest]>;

  constructor(
    private analysisService: AnalysisService,
    private configClient: ConfigClient,
    private algorithmClient: AlgorithmClient,
    private simulationClient: SimulationClient,
    private kafkaClient: KafkaClient,
  ) {
    this.configBreaker = createCircuitBreaker(
      "coordinator->config",
      (configId: string) => this.configClient.getConfig(configId),
      undefined,
      {
        errorFilter: (error) =>
          isAxiosError(error) && (error.response?.status ?? 500) < 500,
      },
    );

    this.fluidsBreaker = createCircuitBreaker(
      "coordinator->fluids",
      (request: AnalyzeRequest) =>
        this.algorithmClient.analyze(Cluster.FLUIDS, request),
      (request: AnalyzeRequest) => this.failFluidsChain(request),
    );
  }

  async assertConfigExists(configId: string) {
    try {
      await this.configBreaker.fire(configId);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException(`Config ${configId} not found`);
      }

      throw new ServiceUnavailableException("Config service unavailable.");
    }
  }

  startFluids(request: AnalyzeRequest) {
    void this.fluidsBreaker.fire(request);
  }

  retry(runId: string, cluster: string) {
    if (!Object.values(Cluster).includes(cluster as Cluster)) {
      throw new BadRequestException(`Unknown cluster "${cluster}".`);
    }

    const retriedCluster = cluster as Cluster;

    this.analysisService.resetProjectionForRetry(runId, retriedCluster);
    this.kafkaClient.emitRetry({
      runId,
      cluster: retriedCluster,
    });

    return {
      accepted: true,
      runId,
      cluster: retriedCluster,
    };
  }

  async simulationStatuses() {
    const entries = await Promise.all(
      Object.values(Cluster).map(async (cluster) => {
        try {
          const status = await this.simulationClient.getStatus(cluster);

          return [cluster, status] as const;
        } catch {
          return [cluster, "down"] as const;
        }
      }),
    );

    return Object.fromEntries(entries) as Record<Cluster, SimulationStatus>;
  }

  async simulate(cluster: string, status: SimulationStatus) {
    if (!Object.values(Cluster).includes(cluster as Cluster)) {
      throw new BadRequestException(`Unknown cluster "${cluster}".`);
    }

    const simulatedCluster = cluster as Cluster;
    const simulationStatus = await this.simulationClient.setStatus(
      simulatedCluster,
      status,
    );

    return {
      cluster: simulatedCluster,
      status: simulationStatus,
    };
  }

  private failFluidsChain(request: AnalyzeRequest) {
    this.applyFailure(request.runId, Cluster.FLUIDS);
    this.applyFailure(request.runId, Cluster.DRIVETRAIN);
    this.applyFailure(request.runId, Cluster.MECHANICAL);
  }

  private applyFailure(runId: string, cluster: Cluster) {
    this.kafkaClient.emitStatus({
      runId,
      cluster,
      status: AlgorithmStatus.FAILED,
    });
  }
}
