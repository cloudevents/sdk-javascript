/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/

import "mocha";
import { expect } from "chai";
import { isStringOrThrow, equalsOrThrow, isBase64, asData } from "../../src/event/validation";

describe("Utilities", () => {
  describe("isStringOrThrow", () => {
    it("should throw when is not a string", () => {
      expect(isStringOrThrow.bind({}, 3.6, new Error("works!"))).to.throw("works!");
    });

    it("should return true when is a string", () => {
      expect(isStringOrThrow("cool", new Error("not throws!"))).to.equal(true);
    });
  });

  describe("equalsOrThrow", () => {
    it("should throw when they are not equals", () => {
      expect(equalsOrThrow.bind({}, "z", "a", new Error("works!"))).to.throw("works!");
    });

    it("should return true when they are equals", () => {
      expect(equalsOrThrow("z", "z", new Error())).to.equal(true);
    });
  });

  describe("isBase64", () => {
    it("should return false when is not base64 string", () => {
      const actual = isBase64("non base 64");

      expect(actual).to.equal(false);
    });

    it("should return true when is a base64 string", () => {
      const actual = isBase64("Y2xvdWRldmVudHMK");

      expect(actual).to.equal(true);
    });
  });

  describe("asData", () => {
    it("should throw error when data is not a valid json", () => {
      const data = "not a json";

      expect(asData.bind({}, data, "application/json")).to.throw();
    });

    it("should parse string content type as string", () => {
      const expected = "a string";

      const actual = asData(expected, "text/plain");

      expect(typeof actual).to.equal("string");
      expect(actual).to.equal(expected);
    });

    it("should parse 'application/json' as json object", () => {
      const expected = {
        much: "wow",
        myext: {
          ext: "x04",
        },
      };

      const actual = asData(JSON.stringify(expected), "application/json");

      expect(typeof actual).to.equal("object");
      expect(actual).to.deep.equal(expected);
    });

    it("should parse 'application/cloudevents+json' as json object", () => {
      const expected = {
        much: "wow",
        myext: {
          ext: "x04",
        },
      };

      const actual = asData(JSON.stringify(expected), "application/cloudevents+json");

      expect(typeof actual).to.equal("object");
      expect(actual).to.deep.equal(expected);
    });

    it("should parse 'text/json' as json object", () => {
      const expected = {
        much: "wow",
        myext: {
          ext: "x04",
        },
      };

      const actual = asData(JSON.stringify(expected), "text/json");

      expect(typeof actual).to.equal("object");
      expect(actual).to.deep.equal(expected);
    });
  });
});
