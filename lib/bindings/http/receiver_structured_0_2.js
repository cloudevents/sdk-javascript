var http = require("http");
var Spec02 = require("../../specs/spec_0_2.js")
var spec02 = new Spec02();

const allowedContentTypes = [];
allowedContentTypes.push("application/cloudevents+json; charset=utf-8");

function is_valid_http_request(req, res, config) {
  var valid = true;

  if(req.url === config.path
      && req.method.toLowerCase()
          === config.method.toLowerCase()) {

    if(!req.headers["content-type"]
        || !allowedContentTypes.includes(
            req.headers["content-type"].toLowerCase())){
      res.statusCode = 400;
      res.end("Bad Request");

      valid = false;
    }

  } else if(req.url !== config.path) {
    res.statusCode = 404;
    res.end("Not Found");

    valid = false;
  } else {
    res.statusCode = 405;
    res.end("Method Not Allowed");

    valid = false;
  }

  return valid;
}

function HTTPStructured(configuration){
  this.config = configuration;

  if(!this.config["path"]){
    this.config["path"] = "/";
  }

  if(!this.config["method"]){
    this.config["method"] = "POST";
  }
}

HTTPStructured.prototype.receive = function(){
  this.server;
  var self = this;

  return new Promise((resolve, reject) => {
    self.server =
      http.createServer((request, res) => {
        if(is_valid_http_request(request, res, this.config)){
          var body = [];
          request.on("error", err => {
            console.error(err);
          })
          .on("data", chunk => {
            // accumulate the chunks
            body.push(chunk);
          })
          .on("end", () => {
            body = Buffer.concat(body).toString();
            var jsonBody = JSON.parse(body);

            try {
              // Process/validate the body
              spec02.check(jsonBody);

              res.statusCode = 201;
              res.end("Event Accepted");
            }catch(e) {
              res.statusCode = 400;
              res.end(JSON.stringify(e));
            }
          });
        }
      });

    self.server.listen(this.config.port, (err) => {
      if(err){
        console.error(err);
        reject(err);
      }
    });
  });
}

HTTPStructured.prototype.stop = function() {
  this.server.close();
}

module.exports = HTTPStructured;
