/* eslint-disable */

const express = require("express");
const { DiscoveryService } = require("cloudevents");
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
    },
    {
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
    },
    {
      type: "com.example.cats.adopt",
    },
    {
      type: "com.example.cats.feed",
    },
    {
      type: "com.example.cats.give",
    },
    {
      // Just to play with discovery service
      type: "com.example.widget.create",
    },
  ],
});

// Serve the discovery service for our services
DiscoveryService.express(app);
// Create a anonymous mapping of cloud events for example
DiscoveryService.express(app, "/anonymous", (name, type, req) => {
  // A true life example would have only one call to express and check req for permission
  // Only give access to the catService and widgetCreate if anonymous
  return name === "com.example.widget.create" || name === "com.example.services.catService";
});

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});
