/* eslint-env node */
const path = require("path");

module.exports = {
  mode: "development",
  entry: ["./src/index.js"],
  output: {
    path: path.resolve(__dirname, "./bin"),
    filename: "app.js",
  },
  devServer: {
    contentBase: "./",
    publicPath: "/bin/",
    liveReload: false,
  },
  devtool: "inline-source-map",
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /\/node_modules\//,
      use: {
        loader: "babel-loader",
      },
    },
    {
      test: /\.s[ac]ss$/i,
      use: [
        // Creates `style` nodes from JS strings
        "style-loader",
        // Translates CSS into CommonJS
        "css-loader",
        // Compiles Sass to CSS
        "sass-loader",
      ],
    }],
  },
};
