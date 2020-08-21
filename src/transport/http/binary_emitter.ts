import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import { CloudEvent, Version } from "../../event/cloudevent";
import { TransportOptions } from "../emitter";
import { Headers } from "../../messages";
import { headersFor } from "../../messages/http/headers";
import { asData } from "../../event/validation";
import CONSTANTS from "../../constants";

/**
 * Send a CloudEvent over HTTP POST to the `options.url` provided.
 * @param {CloudEvent} event the event to send to the remote endpoint
 * @param {TransportOptions} options options provided to the transport layer
 * @returns {Promise<AxiosResponse>} the HTTP response from the transport layer
 */
export async function emitBinary(event: CloudEvent, options: TransportOptions): Promise<AxiosResponse> {
  if (event.specversion !== Version.V1 && event.specversion !== Version.V03) {
    return Promise.reject(`Unknown spec version ${event.specversion}`);
  }
  return emit(event, options, headersFor(event));
}

async function emit(event: CloudEvent, options: TransportOptions, headers: Headers): Promise<AxiosResponse> {
  const contentType: Headers = { [CONSTANTS.HEADER_CONTENT_TYPE]: CONSTANTS.DEFAULT_CONTENT_TYPE };
  const config = {
    ...options,
    method: "POST",
    headers: { ...contentType, ...headers, ...(options.headers as Headers) },
    data: asData(event.data, event.datacontenttype as string),
  };
  return axios.request(config as AxiosRequestConfig);
}
