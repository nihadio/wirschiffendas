import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import type { AxiosRequestConfig } from "axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class HttpClient {
  constructor(private httpService: HttpService) {}

  async get<TResponse>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await firstValueFrom(
      this.httpService.get<TResponse>(url, config),
    );

    return response.data;
  }

  async post<TResponse = unknown, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse> {
    const response = await firstValueFrom(
      this.httpService.post<TResponse>(url, body, config),
    );

    return response.data;
  }

  async delete<TResponse = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await firstValueFrom(
      this.httpService.delete<TResponse>(url, config),
    );

    return response.data;
  }
}
