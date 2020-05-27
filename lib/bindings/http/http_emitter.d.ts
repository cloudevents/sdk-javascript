export = HTTPEmitter;
/**
 * A class which is capable of sending binary and structured events using
 * the CloudEvents HTTP Protocol Binding specification.
 *
 * @see https://github.com/cloudevents/spec/blob/v1.0/http-protocol-binding.md
 * @see https://github.com/cloudevents/spec/blob/v1.0/http-protocol-binding.md#13-content-modes
 */
declare class HTTPEmitter {
    /**
     * Creates a new instance of {HTTPEmitter}. The default emitter uses the 1.0
     * protocol specification in binary mode.
     *
     * @param {Object} [options] The configuration options for this event emitter
     * @param {URL} options.url The endpoint that will receive the sent events.
     * @param {string} [options.version] The HTTP binding specification version. Default: "1.0"
     * @throws {TypeError} if no options.url is provided or an unknown specification version is provided.
     */
    constructor({ url, version }?: {
        url: URL;
        version?: string;
    });
    binary: import("./emitter_binary.js");
    structured: import("./emitter_structured.js");
    url: URL;
    /**
     * Sends the {CloudEvent} to an event receiver over HTTP POST
     *
     * @param {CloudEvent} event the CloudEvent to be sent
     * @param {Object} [options] The configuration options for this event. Options
     * provided will be passed along to Node.js `http.request()`.
     * https://nodejs.org/api/http.html#http_http_request_options_callback
     * @param {URL} [options.url] The HTTP/S url that should receive this event.
     * The URL is optional if one was provided when this emitter was constructed.
     * In that case, it will be used as the recipient endpoint. The endpoint can
     * be overridden by providing a URL here.
     * @param {string} [options.mode] the message mode for sending this event.
     * Possible values are "binary" and "structured". Default: structured
     * @returns {Promise} Promise with an eventual response from the receiver
     */
    send(event: CloudEvent, { url, mode, ...httpOpts }?: {
        url: URL;
        mode: string;
    }): Promise<any>;
    /**
     * Returns the HTTP headers that will be sent for this event when the HTTP transmission
     * mode is "binary". Events sent over HTTP in structured mode only have a single CE header
     * and that is "ce-id", corresponding to the event ID.
     * @param {CloudEvent} event a CloudEvent
     * @returns {Object} the headers that will be sent for the event
     */
    headers(event: CloudEvent): any;
}
declare namespace HTTPEmitter {
    export { CloudEvent };
}
type CloudEvent = import("../../cloudevent.js");
