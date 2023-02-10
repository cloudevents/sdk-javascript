const path = require("path");
const webpack = require("webpack");

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
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ],
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
