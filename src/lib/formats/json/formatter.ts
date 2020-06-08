class JSONFormatter {
  /*
   * Every internal data structure is JSON by nature, so
   * no transformation is required
   */
  format(payload: any) {
    return payload;
  }

  toString(payload: any) {
    return JSON.stringify(payload);
  }
}

export default JSONFormatter;
