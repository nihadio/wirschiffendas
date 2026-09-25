import { Logger } from "@nestjs/common";
import OpossumBreaker from "opossum";

const DEFAULT_OPTIONS: OpossumBreaker.Options = {
  timeout: 5_000,
  errorThresholdPercentage: 50,
  resetTimeout: 10_000,
};

export function createCircuitBreaker<TArgs extends unknown[], TResult>(
  name: string,
  action: (...args: TArgs) => Promise<TResult>,
  fallback?: (...args: TArgs) => unknown,
  options?: OpossumBreaker.Options,
): OpossumBreaker<TArgs, TResult> {
  const breaker = new OpossumBreaker<TArgs, TResult>(action, {
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

type AsyncMethod<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

export function CircuitBreaker(
  name: string,
  fallbackMethod?: string,
  options?: OpossumBreaker.Options,
) {
  return function <TArgs extends unknown[], TResult>(
    _target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<AsyncMethod<TArgs, TResult>>,
  ): void {
    const original = descriptor.value;

    if (!original) {
      return;
    }

    const breakers = new WeakMap<object, OpossumBreaker<TArgs, TResult>>();

    descriptor.value = function (this: object, ...args: TArgs) {
      let breaker = breakers.get(this);

      if (!breaker) {
        const fallback = fallbackMethod
          ? (this as Record<string, (...fbArgs: TArgs) => unknown>)[
              fallbackMethod
            ].bind(this)
          : undefined;

        breaker = createCircuitBreaker(
          name,
          original.bind(this),
          fallback,
          options,
        );
        breakers.set(this, breaker);
      }

      return breaker.fire(...args);
    };
  };
}
