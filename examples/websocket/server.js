/* eslint-disable no-console */
const got = require("got");

const { CloudEvent } = require("cloudevents-sdk");
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const api = "https://api.openweathermap.org/data/2.5/weather";
const key = "REPLACE WITH API KEY";

console.log("WebSocket server started. Waiting for events.");

wss.on("connection", function connection(ws) {
  console.log("Connection received");
  ws.on("message", function incoming(message) {
    const event = new CloudEvent(JSON.parse(message));
    console.log(`Message received: ${event.toString()}`);
    fetch(event.data)
      .then((weather) => {
        ws.send(new CloudEvent({
          dataContentType: "application/json",
          type: "current.weather",
          source: "/weather.server",
          data: weather
        }).toString());
      })
      .catch((err) => {
        console.error(err);
        ws.send(new CloudEvent({
          type: "weather.error",
          source: "/weather.server",
          data: err.toString()
        }).toString());
      });
  });
});

function fetch(zip) {
  const query = `${api}?zip=${zip}&appid=${key}&units=imperial`;
  return new Promise((resolve, reject) => {
    got(query)
      .then((response) => resolve(response.body))
      .catch((err) => reject(err.message));
  });
}
