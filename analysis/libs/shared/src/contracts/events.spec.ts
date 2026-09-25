import { Cluster } from "./enums";
import { KafkaTopics, type TopicPublisher } from "./events";
import type { RetryMessage } from "./messages";

describe("TopicContracts", () => {
  it("binds each topic to its message type", () => {
    const published: [string, unknown][] = [];
    const publish: TopicPublisher = (topic, message) =>
      published.push([topic, message]);
    const retry: RetryMessage = { runId: "run-1", cluster: Cluster.EMS };

    publish(KafkaTopics.RETRY, retry);

    // @ts-expect-error a RetryMessage is not a StatusMessage (no `status`)
    publish(KafkaTopics.STATUS, retry);

    expect(published).toHaveLength(2);
  });
});
