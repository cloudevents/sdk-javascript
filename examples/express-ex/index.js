/* eslint-disable no-console */

const express = require("express");
const app = express();

const v03 = require("cloudevents-sdk/v03");
const unmarshaller03 = new v03.HTTPUnmarshaller();

const v02 = require("cloudevents-sdk/v02");
const unmarshaller02 = new v02.HTTPUnmarshaller();

const v1 = require("cloudevents-sdk/v1");
const structured1 = new v1.StructuredHTTPReceiver();
const binary1 = new v1.BinaryHTTPReceiver();

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

app.post("/v1", function(req, res) {
  console.log(req.headers);
  console.log(req.body);

  try {
    const myevent = structured1.parse(req.body, req.headers);
    // pretty print
    console.log("Accepted event:");
    console.log(JSON.stringify(myevent.format(), null, 2));

    res.status(201)
      .json(myevent.format());
  } catch (err) {
    console.error(err);
    res.status(415)
      .header("Content-Type", "application/json")
      .send(JSON.stringify(err));
  }
});

app.post("/v1/binary", function(req, res) {
  console.log(req.headers);
  console.log(req.body);

  try {
    const myevent = binary1.parse(req.body, req.headers);
    // pretty print
    console.log("Accepted event:");
    console.log(JSON.stringify(myevent.format(), null, 2));

    res.status(201)
      .json(myevent.format());
  } catch (err) {
    console.error(err);
    res.status(415)
      .header("Content-Type", "application/json")
      .send(JSON.stringify(err));
  }
});

app.post("/v03", function(req, res) {
  console.log(req.headers);
  console.log(req.body);

  unmarshaller03.unmarshall(req.body, req.headers)
    .then((cloudevent) => {
      // pretty print
      console.log("Accepted event:");
      console.log(JSON.stringify(cloudevent.format(), null, 2));

      res.status(201)
        .json(cloudevent.format());
    })
    .catch((err) => {
      console.error(err);
      res.status(415)
        .header("Content-Type", "application/json")
        .send(JSON.stringify(err));
    });
});

app.post("/v02", function(req, res) {
  console.log(req.headers);
  console.log(req.body);

  unmarshaller02.unmarshall(req.body, req.headers)
    .then((cloudevent) => {
      // pretty print
      console.log("Accepted event:");
      console.log(JSON.stringify(cloudevent.format(), null, 2));

      res.status(201)
        .json(cloudevent.format());
    })
    .catch((err) => {
      console.error(err);
      res.status(415)
        .header("Content-Type", "application/json")
        .send(JSON.stringify(err));
    });
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
