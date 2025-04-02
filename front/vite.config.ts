/// <reference types="vitest" />
import { defineConfig, UserConfig, Plugin } from "vite"; // PluginContext のインポートを削除
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";
import zipPack from "vite-plugin-zip-pack";
import dotenv from "dotenv";

dotenv.config();

// Custom plugin to handle manifest.json transformation
const manifestPlugin = (): Plugin => {
  // 戻り値の型を Plugin に指定
  return {
    name: "manifest-transform",
    buildStart(this: import("rollup").PluginContext) {
      this.addWatchFile(resolve("src/manifest.json"));
    },
    generateBundle(this: import("rollup").PluginContext) {
      const manifestPath = resolve("src/manifest.json");
      const manifestContent = fs.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(manifestContent);

      // Transform manifest
      const url = process.env.URL;
      if (!url) {
        // URL環境変数が未定義の場合、エラーを投げる
        this.error(
          "Environment variable 'URL' is not defined. Please check your .env file.",
        );
        return; // エラーが発生したら処理を中断
      }
      manifest.host_permissions = [url];

      // content_scripts が存在し、配列であることを確認
      if (
        Array.isArray(manifest.content_scripts) &&
        manifest.content_scripts.length > 0
      ) {
        manifest.content_scripts[0].matches = [url];
      } else {
        // content_scripts がない、または空の場合は警告を出す
        this.warn(
          "manifest.json does not contain 'content_scripts' array or it is empty.",
        );
      }

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    plugins: [
      react(),
      manifestPlugin(),
      ...(isDev
        ? []
        : [
            zipPack({
              inDir: "build",
              outDir: ".",
              outFileName: "nh-bookmark.zip",
            }),
          ]),
    ],
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
    build: {
      outDir: "build",
      emptyOutDir: true,
      sourcemap: isDev,
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        formats: ["iife"],
        name: "index",
        fileName: () => "index.js",
      },
      watch: isDev ? {} : null,
      rollupOptions: {
        output: {
          entryFileNames: "[name].js",
        },
      },
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts", // Add this line
      // you might want to disable it, if you don't have tests that rely on CSS
      // since parsing CSS is slow
      css: true,
      exclude: [...configDefaults.exclude, "**/build/**"],
      coverage: {
        /** For npm workspaces. https://github.com/vitest-dev/vitest/issues/7203 */
        excludeAfterRemap: true,
        exclude: [
          ...(configDefaults.coverage.exclude ?? []),
          "**/__mocks__/**",
        ],
      },
    } satisfies UserConfig["test"],
  };
});
