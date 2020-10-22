/* eslint-disable */

const express = require("express");
const { Receiver, DiscoveryService } = require("cloudevents");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

DiscoveryService.registerService({
  url: "https://example.com/services/widgetService",
  name: "com.example.services.widgetService",
  specversions: ["1.0"],
  subscriptionurl: "https://events.example.com",
  protocols: ["HTTP"],
  types: [
    {
      type: "com.example.widget.create",
      type: "com.example.widget.delete",
    },
  ],
});
DiscoveryService.registerService({
  url: "https://example.com/services/catService",
  name: "com.example.services.catService",
  specversions: ["1.0"],
  subscriptionurl: "https://cats.example.com",
  protocols: ["HTTP"],
  types: [
    {
      type: "com.example.cats.buy",
      type: "com.example.cats.adopt",
      type: "com.example.cats.feed",
      type: "com.example.cats.give",
      // Just to play with discovery service
      type: "com.example.widget.create",
    },
  ],
});

DiscoveryService.express(app);
// Create a anonymous mapping of cloud events for example
DiscoveryService.express(app, "/anonymous", (name, type, req) => {
  // A true life example would have only one call to express and check req for permission
  // Only give access to the catService and widgetCreate if anonymous
  return name === "com.example.widget.create" || name === "com.example.services.catService";
});

app.post("/", (req, res) => {
  console.log("HEADERS", req.headers);
  console.log("BODY", req.body);

  try {
    const event = Receiver.accept(req.headers, req.body);
    // respond as an event
    const responseEventMessage = new CloudEvent({
      source: "/",
      type: "event:response",
      ...event,
    });
    responseEventMessage.data = {
      hello: "world",
    };
    res.status(201).json(responseEventMessage);
  } catch (err) {
    console.error(err);
    res.status(415).header("Content-Type", "application/json").send(JSON.stringify(err));
  }
});

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});
