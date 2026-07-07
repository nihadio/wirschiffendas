import { Logger } from "@nestjs/common";
import CircuitBreaker from "opossum";

const DEFAULT_OPTIONS: CircuitBreaker.Options = {
  timeout: 5_000,
  errorThresholdPercentage: 50,
  resetTimeout: 10_000,
};

export function createCircuitBreaker<TArgs extends unknown[], TResult>(
  name: string,
  action: (...args: TArgs) => Promise<TResult>,
  fallback?: (...args: TArgs) => unknown,
  options?: CircuitBreaker.Options,
): CircuitBreaker<TArgs, TResult> {
  const breaker = new CircuitBreaker<TArgs, TResult>(action, {
    name,
    ...DEFAULT_OPTIONS,
    ...options,
  });

  if (fallback) {
    breaker.fallback(fallback);
  }

  const logger = new Logger(`CircuitBreaker:${name}`);
  breaker.on("failure", (error: Error) =>
    logger.warn(`call failed: ${error.message}`),
  );
  breaker.on("open", () => logger.warn("circuit opened"));
  breaker.on("halfOpen", () => logger.log("circuit half-open, probing"));
  breaker.on("close", () => logger.log("circuit closed"));

  return breaker;
}
