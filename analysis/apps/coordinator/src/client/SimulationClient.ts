import { Injectable } from "@nestjs/common";
import { Cluster, HttpClient } from "@shared";
import { ENV } from "../environment";

type SimulationState = {
  down: boolean;
};

@Injectable()
export class SimulationClient {
  constructor(private httpClient: HttpClient) {}

  getState(cluster: Cluster) {
    return this.httpClient.get<SimulationState>(
      `${ENV.urls[cluster]}/simulate`,
      { timeout: 3_000 },
    );
  }

  setState(cluster: Cluster, state: "down" | "up") {
    return this.httpClient.post<SimulationState>(
      `${ENV.urls[cluster]}/simulate/${state}`,
      undefined,
      { timeout: 3_000 },
    );
  }
}
