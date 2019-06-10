var expect = require("chai").expect;
var Unmarshaller = require("../../../lib/bindings/http/unmarshaller_0_2.js");

describe("HTTP Transport Binding Unmarshaller", () => {

  it("Throw error when payload is null", () => {
    // setup
    var payload = null;
    var un = new Unmarshaller();

    // act and assert
    expect(un.unmarshall.bind(un, payload))
        .to.throw("payload is null or undefined");
  });

  it("Throw error when headers is null", () => {
    // setup
    var payload = {};
    var headers = null;
    var un = new Unmarshaller();

    // act and assert
    expect(un.unmarshall.bind(un, payload, headers))
        .to.throw("headers is null or undefined");
  });

  it("Throw error when there is no content-type header", () => {
    // setup
    var payload = {};
    var headers = {};
    var un = new Unmarshaller();

    // act and assert
    expect(un.unmarshall.bind(un, payload, headers))
        .to.throw("content-type header not found");
  });

  it("Throw error when content-type is not allowed", () => {
    // setup
    var payload = {};
    var headers = {
      "content-type":"text/xml"
    };
    var un = new Unmarshaller();

    // act and assert
    expect(un.unmarshall.bind(un, payload, headers))
        .to.throw("content type not allowed");
  });

  it("Throw error when structured binding has not allowed mime", () => {
    // setup
    var payload = {};
    var headers = {
      "content-type":"application/cloudevents+zip"
    };
    var un = new Unmarshaller();

    // act and assert
    expect(un.unmarshall.bind(un, payload, headers))
        .to.throw("structured+type not allowed");
  });
});
