/* eslint-disable */
import "dotenv/config";
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: 'kafka-ex-client-id',
  brokers: ['localhost:9092'],
});

export default kafka;