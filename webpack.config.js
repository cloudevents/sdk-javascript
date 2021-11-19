/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable header/header */
/* eslint-disable prettier/prettier */
const path = require("path");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

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
  mode: "production",
  plugins: [
    new NodePolyfillPlugin()
  ]
};
