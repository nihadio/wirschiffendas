import { Injectable } from "@nestjs/common";
import { AnalyzeRequest, Cluster, HttpClient } from "@shared";
import { ENV } from "../environment";

@Injectable()
export class AlgorithmClient {
  constructor(private httpClient: HttpClient) {}

  analyze(cluster: Cluster, request: AnalyzeRequest) {
    return this.httpClient.post(`${ENV.urls[cluster]}/analyze`, request);
  }
}
