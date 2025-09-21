/* eslint-disable */
import { CloudEvent, Kafka } from "cloudevents";
import readline from "readline";
import kafka from "./client";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async () => {
  const producer = kafka.producer();
  await producer.connect();

  rl.setPrompt("> ");
  rl.prompt();
  rl.on("line", async (line) => {
    const event = new CloudEvent({
      source: "cloudevents-producer",
      type: "events.cloudevents.test",
      datacontenttype: "text/plain",
      partitionkey: "1",
      data: line,
    });

    const message = Kafka.structured(event);

    console.log("Sending CloudEvent:", message);

    await producer.send({
      topic: "events.cloudevents.test",
      messages: [message],
    });
    rl.prompt();
  });

  rl.on("close", async () => {
    await producer.disconnect();
  });
})();
