import { Controller, Get, Param, Post } from "@nestjs/common";
import { ClusterGateway } from "../gateway/ClusterGateway";

@Controller("simulation")
export class SimulationController {
  constructor(private readonly clusterGateway: ClusterGateway) {}

  @Get("statuses")
  getStatuses() {
    return this.clusterGateway.simulationStatuses();
  }

  @Post(":cluster/down")
  down(@Param("cluster") cluster: string) {
    return this.clusterGateway.simulate(cluster, "down");
  }

  @Post(":cluster/up")
  up(@Param("cluster") cluster: string) {
    return this.clusterGateway.simulate(cluster, "up");
  }
}
