import { BadRequestException } from "@nestjs/common";
import type { AnalyzeRequest } from "../dtos";
import { Cluster } from "../enums";

export function assertUpstreamCluster(
  request: AnalyzeRequest,
  expectedUpstreamClusters: readonly [],
  targetCluster: Cluster,
): undefined;

export function assertUpstreamCluster(
  request: AnalyzeRequest,
  expectedUpstreamClusters: readonly [Cluster, ...Cluster[]],
  targetCluster: Cluster,
): Cluster;

export function assertUpstreamCluster(
  request: AnalyzeRequest,
  expectedUpstreamClusters: readonly Cluster[],
  targetCluster: Cluster,
): Cluster | undefined {
  if (expectedUpstreamClusters.length === 0) {
    if (request.upstreamCluster) {
      throw new BadRequestException(
        `${targetCluster} does not accept an upstreamCluster.`,
      );
    }

    return undefined;
  }

  if (
    !request.upstreamCluster ||
    !expectedUpstreamClusters.includes(request.upstreamCluster)
  ) {
    throw new BadRequestException(
      `${targetCluster} requires upstreamCluster from ${expectedUpstreamClusters.join(" or ")}.`,
    );
  }

  return request.upstreamCluster;
}
