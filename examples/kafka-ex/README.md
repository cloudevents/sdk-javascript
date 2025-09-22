# Kafka Example

## Summary
This is an example on how to use the cloudevents javascript sdk with Kafka in NodeJs.


## Description 
A simple cli application sending user input as a cloudevent message through a kafka producer to a topic. And eventually, the cloudevent message is handled and deserialized correctly by a consumer within a consumer group subscribed to the same topic.

## Dependencies
- NodeJS (>18)
- Kafka running locally or remotely

## Local Kafka Setup with Docker

#### Option 1:  Run Zookeeper and Kafka Dccker Images sequentially with these commands 

```bash
docker run -d \
  --name zookeeper \
  -e ZOOKEEPER_CLIENT_PORT=2181 \
  -e ZOOKEEPER_TICK_TIME=2000 \
  confluentinc/cp-zookeeper:7.3.2

```
```bash
docker run -d \
  --name kafka \
  -p 9092:9092 \
  -e KAFKA_BROKER_ID=1 \
  -e KAFKA_ZOOKEEPER_CONNECT=localhost:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  -e KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS=0 \
  --link zookeeper:zookeeper \
  confluentinc/cp-kafka:7.3.2

```

#### Option 2: Run both images using the docker compose file

```bash
  cd ${directory of the docker compose file}

  docker compose up -d
```

## Then, run the producer (cli) and consumer

#### To Start the Producer
```bash
npm run start:producer
```

#### To Start the Consumer
```bash
npm run start:consumer ${groupId}
```
