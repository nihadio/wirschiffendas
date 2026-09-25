import type { Cluster } from "./enums";

export type SimulationStatus = "down" | "up";

/** Provided by each algorithm service. */
export interface ISimulation {
  getStatus(): SimulationStatus;
  down(): SimulationStatus;
  up(): SimulationStatus;
}

/** Required by the coordinator; fan-out over the clusters. */
export interface ISimulationClient {
  getStatus(cluster: Cluster): Promise<SimulationStatus>;
  setStatus(
    cluster: Cluster,
    status: SimulationStatus,
  ): Promise<SimulationStatus>;
}

export const SIMULATION_CLIENT = Symbol("ISimulationClient");
