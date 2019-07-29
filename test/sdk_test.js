const expect = require("chai").expect;
const v02 = require("../v02/index.js");
const v03 = require("../v03/index.js");

describe("The SDK Requirements", () => {
  describe("v0.2", () => {
    it("should create an event using the right spec version", () => {
      expect(v02.event().spec.payload.specversion).to.equal("0.2");
    });
  });
  
  describe("v0.3", () => {
    it("should create an event using the right spec version", () => {
      expect(v03.event().spec.payload.specversion).to.equal("0.3");
    });
  });
});
