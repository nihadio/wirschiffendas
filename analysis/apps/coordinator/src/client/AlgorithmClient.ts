import { Injectable } from "@nestjs/common";
import { AnalyzeRequest, Cluster, HttpClient, RetryRequest } from "@shared";
import { ENV } from "../environment";

@Injectable()
export class AlgorithmClient {
  constructor(private httpClient: HttpClient) {}

  analyze(cluster: Cluster, request: AnalyzeRequest) {
    return this.httpClient.post(`${ENV.urls[cluster]}/analyze`, request);
  }

  retry(cluster: Cluster, runId: string, request: RetryRequest) {
    return this.httpClient.post(
      `${ENV.urls[cluster]}/retry/${runId}`,
      request,
      { timeout: 3_000 },
    );
  }
}
