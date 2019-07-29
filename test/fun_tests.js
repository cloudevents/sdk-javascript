const expect = require("chai").expect;
const fun = require("../lib/utils/fun.js");

describe("Functional approach", () => {
  describe("isStringOrThrow", () => {
    it("should throw when is not a string", () => {
      expect(fun.isStringOrThrow.bind(fun, 3.6, {message: "works!"}))
        .to
        .throw("works!");
    });

    it("should return true when is a string", () => {
      expect(fun.isStringOrThrow("cool", {message: "not throws!"}))
        .to
        .equals(true);
    });
  });

  describe("equalsOrThrow", () => {
    it("should throw when they are not equals", () => {
      expect(fun.equalsOrThrow.bind(fun, "z", "a", {message: "works!"}))
        .to
        .throw("works!");
    });

    it("should return true when they are equals", () => {
      expect(fun.equalsOrThrow("z", "z", {message: "not throws!"}))
        .to
        .equals(true);
    });
  });
});
