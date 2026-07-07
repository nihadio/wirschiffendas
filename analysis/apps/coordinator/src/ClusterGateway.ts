import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { isAxiosError } from "axios";
import {
  AlgorithmStatus,
  AnalyzeRequest,
  buildFailedResults,
  Cluster,
  CONFIG,
  createCircuitBreaker,
  OptionalEquipmentConfig,
} from "@shared";
import type CircuitBreaker from "opossum";
import { firstValueFrom } from "rxjs";
import { AnalysisService } from "./AnalysisService";

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
    private httpService: HttpService,
    private analysisService: AnalysisService,
  ) {
    // no fallback: without a config there is no run to degrade
    this.configBreaker = createCircuitBreaker(
      "coordinator->config",
      (configId: string) =>
        firstValueFrom(
          this.httpService.get<OptionalEquipmentConfig>(
            `${CONFIG.env.urls.config}/configs/${configId}`,
          ),
        ).then((response) => response.data),
      undefined,
      {
        // a 4xx answer means the service is healthy and rejected the input;
        // it still fails this call but must not open the circuit
        errorFilter: (error) =>
          isAxiosError(error) && (error.response?.status ?? 500) < 500,
      },
    );

    this.analyzeBreakers = {
      // if fluids is dead nothing downstream ever starts, so fail the whole run
      [Cluster.FLUIDS]: this.createAnalyzeBreaker(Cluster.FLUIDS, (request) =>
        Object.values(Cluster).forEach((cluster) =>
          this.applyFailure(request.runId, cluster),
        ),
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
      // config service answered — the config just does not exist
      if (isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException(`Config ${configId} not found`);
      }

      throw new ServiceUnavailableException("Config service unavailable.");
    }
  }

  startFluids(request: AnalyzeRequest) {
    void this.analyzeBreakers[Cluster.FLUIDS].fire(request);
  }

  async retry(runId: string, cluster: string) {
    if (!Object.values(Cluster).includes(cluster as Cluster)) {
      throw new BadRequestException(`Unknown cluster "${cluster}".`);
    }

    const retriedCluster = cluster as Cluster;
    const config = this.analysisService.getConfig(runId); // 404 if run unknown

    this.analysisService.resetForRetry(runId, retriedCluster);

    // a manual retry is the user asserting the service is back: force the
    // circuit closed so the call really goes to the network instead of
    // short-circuiting to the fallback while the open-window lasts
    this.analyzeBreakers[retriedCluster].close();
    this.analyzeBreakers[Cluster.EMS].close();

    if (retriedCluster === Cluster.FLUIDS) {
      // clear EMS upstream cache, otherwise the first re-run upstream
      // completes the set against stale data from the previous run
      await this.resetEms(runId);

      void this.analyzeBreakers[Cluster.FLUIDS].fire({
        runId,
        config,
        upstreamResults: [],
      });
    } else if (retriedCluster === Cluster.EMS) {
      this.retryEms(runId, config);
    } else {
      // ems starts only once BOTH upstreams have called it; the sibling
      // is not re-run here, so reset ems and replay the sibling's stored
      // results on its behalf — the retried service delivers the other half
      await this.resetEms(runId);

      const sibling =
        retriedCluster === Cluster.DRIVETRAIN
          ? Cluster.MECHANICAL
          : Cluster.DRIVETRAIN;

      void this.analyzeBreakers[Cluster.EMS].fire({
        runId,
        config,
        upstreamCluster: sibling,
        upstreamResults:
          this.analysisService.getClusterResults(runId, sibling) ??
          buildFailedResults(sibling),
      });

      void this.analyzeBreakers[retriedCluster].fire({ runId, config });
    }

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
          const { data } = await firstValueFrom(
            this.httpService.get<{ down: boolean }>(
              `${CONFIG.env.urls[cluster]}/simulate`,
              { timeout: 3_000 },
            ),
          );

          return [cluster, data.down] as const;
        } catch {
          // unreachable is indistinguishable from down for the caller
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
    const { data } = await firstValueFrom(
      this.httpService.post<{ down: boolean }>(
        `${CONFIG.env.urls[simulatedCluster]}/simulate/${state}`,
      ),
    );

    return {
      ...data,
      cluster: simulatedCluster,
    };
  }

  // EMS collects one call per upstream; replay both from stored results
  private retryEms(runId: string, config: OptionalEquipmentConfig) {
    for (const upstream of [Cluster.DRIVETRAIN, Cluster.MECHANICAL]) {
      void this.analyzeBreakers[Cluster.EMS].fire({
        runId,
        config,
        upstreamCluster: upstream,
        upstreamResults:
          this.analysisService.getClusterResults(runId, upstream) ??
          buildFailedResults(upstream),
      });
    }
  }

  private createAnalyzeBreaker(
    cluster: Cluster,
    fallback: (request: AnalyzeRequest) => void,
  ) {
    return createCircuitBreaker(
      `coordinator->${cluster}`,
      (request: AnalyzeRequest) =>
        firstValueFrom(
          this.httpService.post(`${CONFIG.env.urls[cluster]}/analyze`, request),
        ),
      fallback,
    );
  }

  private failUpstreamCluster(request: AnalyzeRequest, cluster: Cluster) {
    this.applyFailure(request.runId, cluster);

    // complete the choreography towards EMS on behalf of the dead service
    void this.analyzeBreakers[Cluster.EMS].fire({
      runId: request.runId,
      config: request.config,
      upstreamCluster: cluster,
      upstreamResults: buildFailedResults(cluster),
    });
  }

  // coordinator has no kafka producer; write failures straight into run state
  private applyFailure(runId: string, cluster: Cluster) {
    this.analysisService.applyStatusMessage({
      runId,
      cluster,
      status: AlgorithmStatus.FAILED,
    });

    this.analysisService.applyResultMessage({
      runId,
      cluster,
      results: buildFailedResults(cluster),
    });
  }

  private async resetEms(runId: string) {
    try {
      await firstValueFrom(
        this.httpService.delete(`${CONFIG.env.urls.ems}/analyze/${runId}`),
      );
    } catch {
      // best effort: EMS may be down; its cache is then empty anyway
    }
  }
}
