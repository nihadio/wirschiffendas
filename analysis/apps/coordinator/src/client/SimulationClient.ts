import { Injectable } from "@nestjs/common";
import { Cluster, HttpClient } from "@shared";
import type { ISimulationClient, SimulationStatus } from "@shared";
import { ENV } from "../environment";

@Injectable()
export class SimulationClient implements ISimulationClient {
  constructor(private httpClient: HttpClient) {}

  getStatus(cluster: Cluster) {
    return this.httpClient.get<SimulationStatus>(
      `${ENV.urls[cluster]}/simulation/status`,
      { timeout: 3_000 },
    );
  }

  setStatus(cluster: Cluster, status: SimulationStatus) {
    return this.httpClient.post<SimulationStatus>(
      `${ENV.urls[cluster]}/simulation/${status}`,
      undefined,
      { timeout: 3_000 },
    );
  }
}
