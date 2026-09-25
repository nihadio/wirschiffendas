import { Injectable } from "@nestjs/common";
import {
  type AnalyzeAccepted,
  AnalyzeRequest,
  HttpClient,
  type IAnalyze,
} from "@shared";
import { ENV } from "../environment";

@Injectable()
export class FluidsClient implements IAnalyze {
  constructor(private httpClient: HttpClient) {}

  analyze(request: AnalyzeRequest) {
    return this.httpClient.post<AnalyzeAccepted>(
      `${ENV.urls.fluids}/analyze`,
      request,
    );
  }
}
