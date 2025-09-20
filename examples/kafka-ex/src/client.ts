/* eslint-disable */

import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "kafka-ex-client-id",
  brokers: ["localhost:9092"],
});

export default kafka;
