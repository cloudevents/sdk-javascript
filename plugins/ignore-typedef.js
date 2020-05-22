exports.handlers = {
  beforeParse(e) {
    e.source = e.source.replace(/@typedef.*/, "");
    return e;
  }
};
