var expect       = require("chai").expect;
var Cloudevent   = require("../index.js");

const type   = "com.github.pull.create";
const source = "urn:event:from:myapi/resourse/123";
const time   = new Date();

var cloudevent = new Cloudevent()
                       .type(type)
                       .source(source);

describe("CloudEvents Spec 0.1 - JavaScript SDK", () => {

  describe("JSON Format", () => {

    describe("Required context attributes", () => {
      it("requires 'eventType'", () => {
        expect(cloudevent.format()).to.have.property('eventType');
      });

      it("requires 'cloudEventsVersion'", () => {
        expect(cloudevent.format()).to.have.property('cloudEventsVersion');
      });

      it("requires 'source'", () => {
        expect(cloudevent.format()).to.have.property('source');
      });

      it("requires 'eventID'", () => {
        expect(cloudevent.format()).to.have.property('eventID');
      });
    });

    describe("Backward compatibility", () => {
      it("should have 'eventTypeVersion'", () => {
        cloudevent.eventTypeVersion("1.0");
        expect(cloudevent.format()).to.have.property('eventTypeVersion');
      });
    });

    describe("The Constraint check", () => {
      describe("'eventType'", () => {
        it("should throw an error when is an empty string", () => {
          cloudevent.type("");
          expect(cloudevent.format.bind(cloudevent))
            .to
            .throw("'eventType' is invalid");
        });

        it("must be a non-empty string", () => {
          cloudevent.type(type);
          cloudevent.format();
        });

        it("should be prefixed with a reverse-DNS name", () => {
          //TODO how to assert it?
        });
      });

      //TODO another attributes . . .

      describe("'eventTime'", () => {
        it("must adhere to the format specified in RFC 3339", () => {
          cloudevent.time(time);
          expect(cloudevent.format()['eventTime']).to.equal(time.toISOString());
        });
      });
    });

  });

});
