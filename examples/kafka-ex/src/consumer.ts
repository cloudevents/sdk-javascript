/* eslint-disable */
import { Headers, Kafka, Message } from "cloudevents";
import kafka from "./client";

const groupId = process.argv[2];

console.log(process.argv, groupId);

(async () => {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();

  consumer.subscribe({ topic: "events.cloudevents.test" });

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("Raw Kafka message:", {
        topic,
        partition,
        offset: message.offset,
        headers: message.headers,
        value: message.value?.toString(),
      });

      try {
        let newHeaders: Headers = {};
        Object.keys(message.headers as Headers).forEach((key) => {
          // this is needed here because the headers are buffer values 
          // when it gets to the consumer which is invalid for the 
          // toEvent api from cloudevents, so this converts each key value to a string
          // as expected by the toEvent api
          newHeaders[key] = message!.headers![key]?.toString() ?? "";
        });

        message.headers = newHeaders;
        const messageValue = Kafka.toEvent(
          message as unknown as Message<string>
        );

        console.log("Deserialized CloudEvent:", messageValue);
        // message is automatically acknowledged when the callback is finished
      } catch (error) {
        console.error("Error deserializing CloudEvent:", error);
        console.log("Raw message value:", message.value?.toString());
      }
    },
  });
})();
