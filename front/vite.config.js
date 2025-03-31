import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import zipPack from 'vite-plugin-zip-pack';
import dotenv from 'dotenv';

dotenv.config();

// Custom plugin to handle manifest.json transformation
const manifestPlugin = () => {
  return {
    name: 'manifest-transform',
    buildStart() {
      this.addWatchFile(resolve('src/manifest.json'));
    },
    generateBundle() {
      const manifestPath = resolve('src/manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      
      // Transform manifest
      manifest.host_permissions = [process.env.URL];
      manifest.content_scripts[0].matches = [process.env.URL];
      
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(manifest, null, 2)
      });
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    plugins: [
      react(),
      manifestPlugin(),
      ...(isDev ? [] : [zipPack({
        inDir: 'build',
        outDir: '.',
        outFileName: 'nh-bookmark.zip'
      })])
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    build: {
      outDir: 'build',
      emptyOutDir: true,
      sourcemap: isDev,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['iife'],
        name: 'index',
        fileName: () => 'index.js'
      },
      watch: isDev ? {} : null,
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
        }
      }
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js']
    }
  };
});
