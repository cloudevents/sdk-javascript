/* eslint-disable */
import { CloudEvent, MQTT } from "cloudevents";
import * as mqtt from "mqtt";

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", function () {
  client.subscribe("presence", function (err) {
    if (err) return;
    const event = new CloudEvent({
      source: "presence",
      type: "presence.event",
      datacontenttype: "application/json",
      data: {
        hello: "world",
      },
    });
    const { body, headers } = MQTT.binary(event);

    client.publish("presence", JSON.stringify(body), {
      properties: {
        userProperties: headers as mqtt.UserProperties,
      },
    });
  });
});

client.on("message", function (topic, message, packet) {
  const event = MQTT.toEvent({
    body: JSON.parse(message.toString()),
    headers: packet.properties?.userProperties || {},
  });
  console.log(event);
  client.end();
});
