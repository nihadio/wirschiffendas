import { Injectable } from "@nestjs/common";
import { HttpClient, OptionalEquipmentConfig } from "@shared";
import { ENV } from "../environment";

@Injectable()
export class ConfigClient {
  constructor(private httpClient: HttpClient) {}

  getConfig(configId: string) {
    return this.httpClient.get<OptionalEquipmentConfig>(
      `${ENV.urls.config}/configs/${configId}`,
    );
  }
}
