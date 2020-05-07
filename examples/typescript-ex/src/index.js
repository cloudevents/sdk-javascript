"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const v1_1 = require("cloudevents-sdk/v1");
function doSomeStuff() {
    const myevent = v1_1.event()
        .source('/source')
        .type('type')
        .dataContentType('text/plain')
        .dataschema('http://d.schema.com/my.json')
        .subject('cha.json')
        .data('my-data')
        .addExtension("my-ext", "0x600");
    console.log(myevent.toString());
    console.log(myevent.getExtensions());
    const config = {
        method: "POST",
        url: "https://enu90y24i64jp.x.pipedream.net/"
    };
    // ------ emitter structured
    const structured = new v1_1.StructuredHTTPEmitter(config);
    structured.emit(myevent).then(res => {
        // success
        console.log("Structured Mode: Success!");
    })
        .catch(err => {
        // error
        console.error(err);
    });
    // ------ emitter binary
    const binary = new v1_1.BinaryHTTPEmitter(config);
    binary.emit(myevent).then(res => {
        console.log("Binary Mode: Success!");
    })
        .catch(err => {
        console.error(err);
    });
    // ------ receiver structured
    const payload = myevent.toString();
    const headers = {
        "Content-Type": "application/cloudevents+json"
    };
    const receiverStructured = new v1_1.StructuredHTTPReceiver();
    console.log(receiverStructured.parse(payload, headers).toString());
    // ------ receiver binary
    const extension1 = "mycuston-ext1";
    const data = {
        "data": "dataString"
    };
    const attributes = {
        "ce-type": "type",
        "ce-specversion": "1.0",
        "ce-source": "source",
        "ce-id": "id",
        "ce-time": "2019-06-16T11:42:00Z",
        "ce-dataschema": "http://schema.registry/v1",
        "Content-Type": "application/json",
        "ce-extension1": extension1
    };
    const receiverBinary = new v1_1.BinaryHTTPReceiver();
    console.log(receiverBinary.parse(data, attributes).toString());
    return true;
}
exports.doSomeStuff = doSomeStuff;
doSomeStuff();
