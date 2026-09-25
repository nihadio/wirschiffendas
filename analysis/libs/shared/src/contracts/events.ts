import type { ResultMessage, RetryMessage, StatusMessage } from "./messages";

export const KafkaTopics = {
  STATUS: "analysis-status",
  RESULT: "analysis-result",
  RETRY: "analysis-retry",
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];

/** Message contract per topic. */
export type TopicContracts = {
  [KafkaTopics.STATUS]: StatusMessage;
  [KafkaTopics.RESULT]: ResultMessage;
  [KafkaTopics.RETRY]: RetryMessage;
};

// Compile-time check: every topic in KafkaTopics has a message contract.
const _topicContractsComplete: Record<KafkaTopic, unknown> =
  {} as TopicContracts;
void _topicContractsComplete;

/** Publishes a message on a topic; the payload type follows from the topic. */
export type TopicPublisher = <T extends KafkaTopic>(
  topic: T,
  message: TopicContracts[T],
) => unknown;

/** Required side (publisher). Method names kept from KafkaClient to minimise the diff. */
export interface IEventPublisher {
  emitStatus(message: StatusMessage): unknown;
  emitResult(message: ResultMessage): unknown;
  emitRetry(message: RetryMessage): unknown;
}

export const EVENT_PUBLISHER = Symbol("IEventPublisher");

/** Provided side (consumers). Method names match the existing @EventPattern handlers. */
export interface IStatusEvents {
  onStatusEvent(message: StatusMessage): void;
}

export interface IResultEvents {
  onResultEvent(message: ResultMessage): void;
}

export interface IRetryCommands {
  onRetryEvent(message: RetryMessage): void;
}
