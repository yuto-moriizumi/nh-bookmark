/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");

module.exports = () => {
  return {
    mode: process.env.TARGET === "dev" ? "development" : "production",
    watch: process.env.TARGET === "dev",
    // Paratranz doesn't allow eval by its CSP
    devtool:
      process.env.TARGET === "dev" ? "cheap-module-source-map" : undefined,
    entry: {
      index: "./src/index.ts",
    },
    output: {
      path: path.join(__dirname, "build"),
      filename: "[name].js",
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [{ loader: "ts-loader" }],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
      new CopyPlugin({
        patterns: ["manifest.json", "logo.png", "logo48.png", "logo32.png"].map(
          (name) => ({
            from: "src/" + name,
            to: name,
          }),
        ),
      }),
      ...(process.env.TARGET === "dev"
        ? []
        : [new ZipPlugin({ filename: "paratranz-helper" })]),
    ],
  };
};
