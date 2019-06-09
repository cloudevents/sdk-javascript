var expect = require("chai").expect;
var Unmarshaller = require("../../../lib/bindings/http/unmarshaller_0_2.js");

describe("HTTP Unmarshaller - Version 0.2", () => {

  it("Throw error when payload is not string or object", () => {
    // setup
    var payload = 83;
    var unmarshaller = new Unmarshaller();

    // act and assert
    expect(unmarshaller.unmarshall.bind(payload))
        .to.throw("Invalid payload type, allowed are: string or object");
  });
});
