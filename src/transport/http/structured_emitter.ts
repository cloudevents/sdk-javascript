import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { CloudEvent } from "../../event";
import { TransportOptions } from "../emitter";
import CONSTANTS from "../../constants";

const defaults = {
  headers: {
    [CONSTANTS.HEADER_CONTENT_TYPE]: CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
  },
};

export function emitStructured(event: CloudEvent, options: TransportOptions): Promise<AxiosResponse> {
  const config = {
    ...defaults,
    ...options,
    method: "POST",
    data: event,
  };
  return axios.request(config as AxiosRequestConfig);
}
