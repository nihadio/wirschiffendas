import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { isAxiosError, type AxiosError } from "axios";
import type { Request, Response } from "express";

type ErrorPayload = {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
  upstream?: {
    statusCode?: number;
    method?: string;
    url?: string;
  };
};

type ErrorResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const payload = this.toPayload(exception, request.url);

    response.status(payload.statusCode).json(payload);
  }

  private toPayload(exception: unknown, path: string): ErrorPayload {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, path);
    }

    if (isAxiosError(exception)) {
      return this.fromAxiosError(exception, path);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: "Internal Server Error",
      path,
      timestamp: new Date().toISOString(),
    };
  }

  private fromHttpException(
    exception: HttpException,
    path: string,
  ): ErrorPayload {
    const response = exception.getResponse();
    const body = this.toErrorResponse(response);

    return {
      statusCode: exception.getStatus(),
      message: body.message ?? exception.message,
      error: body.error ?? exception.name,
      path,
      timestamp: new Date().toISOString(),
    };
  }

  private fromAxiosError(exception: AxiosError, path: string): ErrorPayload {
    const statusCode = exception.response?.status ?? HttpStatus.BAD_GATEWAY;
    const body = this.toErrorResponse(exception.response?.data);

    return {
      statusCode,
      message: body.message ?? "Downstream service request failed",
      error: body.error ?? exception.response?.statusText ?? "Bad Gateway",
      path,
      timestamp: new Date().toISOString(),
      upstream: {
        statusCode: exception.response?.status,
        method: exception.config?.method?.toUpperCase(),
        url: exception.config?.url,
      },
    };
  }

  private toErrorResponse(response: unknown): ErrorResponse {
    if (typeof response === "string") {
      return { message: response };
    }

    if (!response || typeof response !== "object") {
      return {};
    }

    const body = response as Record<string, unknown>;

    return {
      statusCode:
        typeof body.statusCode === "number" ? body.statusCode : undefined,
      message: this.toMessage(body.message),
      error: typeof body.error === "string" ? body.error : undefined,
    };
  }

  private toMessage(message: unknown): string | string[] | undefined {
    if (typeof message === "string") {
      return message;
    }

    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === "string")
    ) {
      return message;
    }

    return undefined;
  }
}
