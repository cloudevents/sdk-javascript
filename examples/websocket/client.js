/* eslint-disable no-console */
const readline = require("readline");
const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:8080");

const { CloudEvent } = require("cloudevents-sdk");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("close", (_) => console.log("\n\nConnection closed! Press CTL-C to exit."));

ws.on("message", function incoming(message) {
  const event = new CloudEvent(JSON.parse(message));
  if (event.type === "weather.error") {
    console.error(`Error: ${event.data}`);
  } else {
    print(event.data);
  }
  ask();
});

function ask() {
  rl.question("Would you like to see the current weather? Provide a zip code: ", function (zip) {
    console.log("Fetching weather data from server...");
    const event = new CloudEvent({
      type: "weather.query",
      source: "/weather.client",
      data: { zip },
    });
    ws.send(event.toString());
  });
}

function print(data) {
  console.log(`
Current weather for ${data.name}: ${data.weather[0].main}
------------------------------------------
With ${data.weather[0].description}, the temperature is ${Math.round(data.main.temp)}F
and the wind is blowing at ${Math.round(data.wind.speed)}mph.
`);
}

ask();
