const expect = require("chai").expect;
const fun = require("../lib/bindings/http/validation/fun.js");

describe("Functional approach", () => {
  describe("isStringOrThrow", () => {
    it("should throw when is not a string", () => {
      expect(fun.isStringOrThrow.bind(fun, 3.6, { message: "works!" }))
        .to
        .throw("works!");
    });

    it("should return true when is a string", () => {
      expect(fun.isStringOrThrow("cool", { message: "not throws!" }))
        .to
        .equals(true);
    });
  });

  describe("equalsOrThrow", () => {
    it("should throw when they are not equals", () => {
      expect(fun.equalsOrThrow.bind(fun, "z", "a", { message: "works!" }))
        .to
        .throw("works!");
    });

    it("should return true when they are equals", () => {
      expect(fun.equalsOrThrow("z", "z", { message: "not throws!" }))
        .to
        .equals(true);
    });
  });

  describe("isBase64", () => {
    it("should return false when is not base64 string", () => {
      const actual = fun.isBase64("non base 64");

      expect(actual).to.equal(false);
    });

    it("should return true when is a base64 string", () => {
      const actual = fun.isBase64("Y2xvdWRldmVudHMK");

      expect(actual).to.equal(true);
    });
  });

  describe("asData", () => {
    it("should throw error when data is not a valid json", () => {
      const data = "not a json";

      expect(fun.asData.bind(fun, data, "application/json"))
        .to
        .throws();
    });

    it("should parse string content type as string", () => {
      const expected = "a string";

      const actual = fun.asData(expected, "text/plain");

      expect((typeof actual)).to.equal("string");
      expect(actual).to.equal(expected);
    });

    it("should parse 'application/json' as json object", () => {
      const expected = {
        much: "wow",
        myext: {
          ext: "x04"
        }
      };

      const actual = fun.asData(JSON.stringify(expected), "application/json");

      expect((typeof actual)).to.equal("object");
      expect(actual).to.deep.equal(expected);
    });

    it("should parse 'application/cloudevents+json' as json object", () => {
      const expected = {
        much: "wow",
        myext: {
          ext: "x04"
        }
      };

      const actual = fun.asData(JSON.stringify(expected),
        "application/cloudevents+json");

      expect((typeof actual)).to.equal("object");
      expect(actual).to.deep.equal(expected);
    });

    it("should parse 'text/json' as json object", () => {
      const expected = {
        much: "wow",
        myext: {
          ext: "x04"
        }
      };

      const actual = fun.asData(JSON.stringify(expected),
        "text/json");

      expect((typeof actual)).to.equal("object");
      expect(actual).to.deep.equal(expected);
    });
  });
});
