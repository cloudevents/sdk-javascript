import { Message, Options } from "../..";
import axios from "axios";

export function axiosEmitter(sink: string) {
  return function (message: Message, options?: Options): Promise<unknown> {
    options = { ...options };
    const headers = {
      ...message.headers,
      ...(options.headers as Record<string, string>),
    };
    delete options.headers;
    return axios.post(sink, message.body, {
      headers: headers,
      ...options,
    });
  };
}
