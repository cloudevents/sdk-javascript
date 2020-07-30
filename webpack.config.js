const path = require("path");

module.exports = {
  entry: {
    "cloudevents": "./browser/index.js"
  },
  output: {
    path: path.resolve(__dirname, "bundles"),
    filename: "[name].js",
    libraryTarget: "umd",
    library: "cloudevents",
    umdNamedDefine: true
  },
  devtool: "source-map",
  mode: "production"
};
