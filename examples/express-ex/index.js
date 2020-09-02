/* eslint-disable */

const express = require("express");
const { Receiver } = require("cloudevents");
const app = express();
const bodyParser = require('body-parser')
app.use(bodyParser.json())

app.post("/", (req, res) => {
  console.log("HEADERS", req.headers);
  console.log("BODY", req.body);

  try {
    const event = Receiver.accept(req.headers, req.body);
    // respond as an event
    const responseEventMessage = new CloudEvent({
      source: '/',
      type: 'event:response',
      ...event
    });
    responseEventMessage.data = {
      hello: 'world'
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
