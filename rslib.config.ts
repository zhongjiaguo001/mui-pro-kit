import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

const libraryEntries = [
  './src/index.ts',
  './src/components/DataGridPro/**/*.{ts,tsx}',
  './src/components/DatePicker/**/*.{ts,tsx}',
  './src/components/Message/**/*.{ts,tsx}',
  './src/components/NavMenu/**/*.{ts,tsx}',
  '!**/*.test.{ts,tsx}',
];

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    tsconfigPath: './tsconfig.lib.json',
    entry: {
      index: libraryEntries,
    },
  },
  lib: [
    {
      format: 'esm',
      bundle: false,
      outBase: './src',
      syntax: 'es2022',
      dts: true,
      output: {
        distPath: {
          root: './dist/esm',
        },
        copy: [{ from: './src/styles.css', to: '../styles.css' }],
      },
    },
    {
      format: 'cjs',
      bundle: false,
      outBase: './src',
      syntax: 'es2022',
      dts: {
        autoExtension: true,
      },
      output: {
        distPath: {
          root: './dist/cjs',
        },
      },
    },
  ],
  output: {
    target: 'web',
    cleanDistPath: true,
    autoExternal: {
      dependencies: true,
      peerDependencies: true,
      optionalDependencies: true,
      devDependencies: false,
    },
  },
});
