import { Controller, Get, Param, Post } from "@nestjs/common";
import type {
  Cluster,
  ClusterSimulationStatus,
  ISimulationProxy,
  SimulationStatus,
} from "@shared";
import { ClusterGateway } from "../gateway/ClusterGateway";

@Controller("simulation")
export class SimulationController implements ISimulationProxy {
  constructor(private readonly clusterGateway: ClusterGateway) {}

  @Get("statuses")
  getStatuses(): Promise<Record<Cluster, SimulationStatus>> {
    return this.clusterGateway.simulationStatuses();
  }

  @Post(":cluster/down")
  down(@Param("cluster") cluster: string): Promise<ClusterSimulationStatus> {
    return this.clusterGateway.simulate(cluster, "down");
  }

  @Post(":cluster/up")
  up(@Param("cluster") cluster: string): Promise<ClusterSimulationStatus> {
    return this.clusterGateway.simulate(cluster, "up");
  }
}
