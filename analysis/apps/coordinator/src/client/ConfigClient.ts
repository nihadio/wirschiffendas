import { Injectable } from "@nestjs/common";
import { type ConfigView, HttpClient, type IConfigLookup } from "@shared";
import { ENV } from "../environment";

@Injectable()
export class ConfigClient implements IConfigLookup {
  constructor(private httpClient: HttpClient) {}

  getConfig(configId: string) {
    return this.httpClient.get<ConfigView>(
      `${ENV.urls.config}/configs/${configId}`,
    );
  }
}
