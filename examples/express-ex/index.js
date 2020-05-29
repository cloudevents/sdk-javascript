/* eslint-disable no-console */

const express = require("express");
const { HTTPReceiver } = require("../../src");

const app = express();
const receiver = new HTTPReceiver();

app.use((req, res, next) => {
  let data = "";

  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    data += chunk;
  });

  req.on("end", function() {
    req.body = data;
    next();
  });
});

app.post("/", function(req, res) {
  console.log(req.headers);
  console.log(req.body);

  try {
    const event = receiver.accept(req.headers, req.body);
    const asJSON = event.format();
    console.log(`Accepted event: ${JSON.stringify(event.format(), null, 2)}`);
    res.status(201).json(asJSON);
  } catch (err) {
    console.error(err);
    res.status(415)
      .header("Content-Type", "application/json")
      .send(JSON.stringify(err));
  }
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
