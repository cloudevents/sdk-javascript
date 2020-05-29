class JSONFormatter {
  /*
   * Every internal data structure is JSON by nature, so
   * no transformation is required
   */
  format(payload) {
    return payload;
  }

  toString(payload) {
    return JSON.stringify(payload);
  }
}

module.exports = JSONFormatter;
