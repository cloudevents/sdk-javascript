import kafka from "./client";

(async () => {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: [
      {
        topic: "events.cloudevents.test",
        numPartitions: 2,
      },
    ],
  });
  await admin.disconnect();
})();
