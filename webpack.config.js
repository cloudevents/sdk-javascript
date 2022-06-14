const path = require("path");

module.exports = {
  entry: {
    "cloudevents": "./browser/index.js"
  },
  resolve: {
    fallback: {
      util: require.resolve("util/"),
      http: false,
      https: false
    },
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
