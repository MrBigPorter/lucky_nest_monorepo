'use strict';

const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');

// Monorepo: 包都 hoist 到根目录的 node_modules
const MONO_ROOT_NM = path.resolve(__dirname, '../../node_modules');
const LOCAL_NM = path.resolve(__dirname, 'node_modules');

/**
 * NestJS webpack 配置
 *  - 所有 node_modules 保持外部引用 (不打包进 bundle)
 *  - @lucky/* workspace 包内联进 bundle (不需要运行时再单独加载)
 *  - Terser 压缩: 保留类名 / 函数名 (NestJS 装饰器反射必须)
 */
module.exports = (options) => ({
  ...options,

  externals: [
    nodeExternals({
      modulesDir: MONO_ROOT_NM,         // 主要: 根目录 hoisted node_modules
      additionalModuleDirs: [LOCAL_NM], // 补充: api 本地 node_modules
      allowlist: [/^@lucky\//],         // @lucky/* 内联进 bundle
    }),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // ⚠️ 必须保留类名 / 函数名 — NestJS DI & reflect-metadata 依赖
          keep_classnames: true,
          keep_fnames: true,
          mangle: {
            keep_classnames: true,
            keep_fnames: true,
          },
          compress: {
            dead_code: true,
            drop_debugger: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
});
