const path = require("path");

module.exports = {
  entry: {
    "cloudevents-sdk": "./browser/index.js"
  },
  output: {
    path: path.resolve(__dirname, "_bundles"),
    filename: "[name].js",
    libraryTarget: "umd",
    library: "cloudevents-sdk",
    umdNamedDefine: true
  },
  devtool: "source-map",
  mode: "production"
};