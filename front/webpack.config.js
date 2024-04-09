/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const dotenv = require("dotenv");
dotenv.config();

module.exports = () => {
  return {
    mode: process.env.TARGET === "dev" ? "development" : "production",
    watch: process.env.TARGET === "dev",
    devtool:
      process.env.TARGET === "dev" ? "eval" : undefined,
    entry: { index: "./src/index.ts" },
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
        patterns: [
          {
            from: "src/manifest.json",
            to: "manifest.json",
            transform(content) {
              /** @type import("./src/manifest.json") */
              const json = JSON.parse(content.toString());
              // 動的に値を変更
              json.host_permissions = [process.env.URL];
              json.content_scripts[0].matches = [process.env.URL];
              return JSON.stringify(json);
            },
          },
        ],
      }),
      ...(process.env.TARGET === "dev"
        ? []
        : [new ZipPlugin({ filename: "nh-bookmark" })]),
    ],
  };
};
