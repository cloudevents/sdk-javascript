var express = require('express');
var app = express();

app.get('/', function (req, res) {
  console.log(req.headers);
  console.log(req.body);

  // TODO use the Unmarshaller
  
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
