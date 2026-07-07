import { Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Cluster } from "@shared";
import { ClusterGateway } from "../gateway/ClusterGateway";

@ApiTags("Failure Simulation")
@Controller("simulate")
export class SimulationController {
  constructor(private readonly clusterGateway: ClusterGateway) {}

  @ApiOperation({
    summary: "Current simulation state of all analysis services",
  })
  @ApiResponse({ status: 200, description: "Down flag per cluster" })
  @Get()
  states() {
    return this.clusterGateway.simulationStates();
  }

  @ApiOperation({ summary: "Simulate one analysis service being down" })
  @ApiParam({ name: "cluster", enum: Cluster })
  @ApiResponse({ status: 201, description: "Service now rejects /analyze" })
  @Post(":cluster/down")
  down(@Param("cluster") cluster: string) {
    return this.clusterGateway.simulate(cluster, "down");
  }

  @ApiOperation({ summary: "Bring one analysis service back up" })
  @ApiParam({ name: "cluster", enum: Cluster })
  @ApiResponse({ status: 201, description: "Service accepts /analyze again" })
  @Post(":cluster/up")
  up(@Param("cluster") cluster: string) {
    return this.clusterGateway.simulate(cluster, "up");
  }
}
