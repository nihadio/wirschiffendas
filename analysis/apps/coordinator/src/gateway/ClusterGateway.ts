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
  FailureReason,
  KafkaClient,
  OptionalEquipmentConfig,
} from "@shared";
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
  private readonly analyzeBreakers: Record<
    Cluster,
    CircuitBreaker<[AnalyzeRequest]>
  >;

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

    this.analyzeBreakers = {
      [Cluster.FLUIDS]: this.createAnalyzeBreaker(Cluster.FLUIDS, (request) =>
        this.failFluidsChain(request),
      ),
      [Cluster.DRIVETRAIN]: this.createAnalyzeBreaker(
        Cluster.DRIVETRAIN,
        (request) => this.failUpstreamCluster(request, Cluster.DRIVETRAIN),
      ),
      [Cluster.MECHANICAL]: this.createAnalyzeBreaker(
        Cluster.MECHANICAL,
        (request) => this.failUpstreamCluster(request, Cluster.MECHANICAL),
      ),
      [Cluster.EMS]: this.createAnalyzeBreaker(Cluster.EMS, (request) =>
        this.applyFailure(request.runId, Cluster.EMS),
      ),
    };
  }

  async getConfig(configId: string) {
    try {
      return await this.configBreaker.fire(configId);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException(`Config ${configId} not found`);
      }

      throw new ServiceUnavailableException("Config service unavailable.");
    }
  }

  startFluids(request: AnalyzeRequest) {
    void this.analyzeBreakers[Cluster.FLUIDS].fire(request);
  }

  retry(runId: string, cluster: string) {
    if (!Object.values(Cluster).includes(cluster as Cluster)) {
      throw new BadRequestException(`Unknown cluster "${cluster}".`);
    }

    const retriedCluster = cluster as Cluster;
    const config = this.analysisService.getConfig(runId);
    this.analysisService.resetForRetry(runId, retriedCluster);
    this.analyzeBreakers[retriedCluster].close();
    void this.analyzeBreakers[retriedCluster].fire({ runId, config });
    return {
      accepted: true,
      runId,
      cluster: retriedCluster,
    };
  }

  async simulationStates() {
    const entries = await Promise.all(
      Object.values(Cluster).map(async (cluster) => {
        try {
          const state = await this.simulationClient.getState(cluster);

          return [cluster, state.down] as const;
        } catch {
          return [cluster, true] as const;
        }
      }),
    );

    return Object.fromEntries(entries) as Record<Cluster, boolean>;
  }

  async simulate(cluster: string, state: "down" | "up") {
    if (!Object.values(Cluster).includes(cluster as Cluster)) {
      throw new BadRequestException(`Unknown cluster "${cluster}".`);
    }

    const simulatedCluster = cluster as Cluster;
    const data = await this.simulationClient.setState(simulatedCluster, state);

    return {
      ...data,
      cluster: simulatedCluster,
    };
  }

  private createAnalyzeBreaker(
    cluster: Cluster,
    fallback: (request: AnalyzeRequest) => void,
  ) {
    return createCircuitBreaker(
      `coordinator->${cluster}`,
      (request: AnalyzeRequest) =>
        this.algorithmClient.analyze(cluster, request),
      fallback,
    );
  }

  private failUpstreamCluster(request: AnalyzeRequest, cluster: Cluster) {
    this.applyFailure(request.runId, cluster);
  }

  private failFluidsChain(request: AnalyzeRequest) {
    this.applyFailure(request.runId, Cluster.FLUIDS);
    this.applyFailure(request.runId, Cluster.DRIVETRAIN, "blocked");
    this.applyFailure(request.runId, Cluster.MECHANICAL, "blocked");
  }

  private applyFailure(
    runId: string,
    cluster: Cluster,
    reason?: FailureReason,
  ) {
    this.kafkaClient.emitStatus({
      runId,
      cluster,
      status: AlgorithmStatus.FAILED,
      ...(reason ? { reason } : {}),
    });
  }
}
