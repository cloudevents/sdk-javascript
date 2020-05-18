const ReceiverV1 = require("./v1/receiver_structured_1.js");
const ReceiverV3 = require("./v03/receiver_structured_0_3.js");

const { SPEC_V03, SPEC_V1 } = require("./constants.js");
const { check, parse } = require("./validation/structured.js");

class StructuredHTTPReceiver {
  constructor(version = SPEC_V1) {
    if (version === SPEC_V1) {
      this.receiver = new ReceiverV1();
    } else if (version === SPEC_V03) {
      this.receiver = new ReceiverV3();
    }
  }

  check(payload, headers) {
    return check(payload, headers, this.receiver);
  }

  parse(payload, headers) {
    return parse(payload, headers, this.receiver);
  }
}

module.exports = StructuredHTTPReceiver;
