/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var webpack = require('webpack');
var package = require('./package.json');
var path = require('path');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
var tsConfigPath = path.resolve(__dirname, './src/tsconfig.json');

// Custom webpack loaders are generally the same for all webpack bundles, hence
// stored in a separate local variable.
var rules = [
  { test: /\.json$/, use: 'json-loader' },
  { test: /\.ts$/, loader: 'ts-loader', options: {
    transpileOnly: true
  }},
  { test: /\.css$/, use: [
    "style-loader",
    "css-loader"
  ] },
  { test: /\.scss$/, use: [
    "style-loader",
    "css-loader",
    "sass-loader"
  ] },
  { test: /\.(jpg|png|gif)$/, loader: "url-loader?limit=10000" },
  { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
  { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
  { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
  { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
  { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/svg+xml" },
  { test: /\.html$/, use: 'html-loader' }
];

var plugins = [
  new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  new webpack.ProvidePlugin({
    "$":"jquery",
    "jQuery":"jquery",
    "window.jQuery":"jquery"
  }),
  new TsconfigPathsPlugin({ configFile: tsConfigPath }),
  new ForkTsCheckerWebpackPlugin({
    tsconfig: tsConfigPath,
    watch: 'src',
    workers: ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE
  }),
  new webpack.DefinePlugin({
    BEAKERX_MODULE_VERSION: JSON.stringify("*") // The latest version
  })
];

var externals = [
  '@jupyter-widgets/base',
  '@jupyter-widgets/controls'
];

var resolve = {
  modules: ['web_modules', 'node_modules'],
  extensions: ['.ts', '.jsx','.js','.less','.css']
};

module.exports = [
  {// Notebook extension
    //
    // This bundle only contains the part of the JavaScript that is run on
    // load of the notebook. This section generally only performs
    // some configuration for requirejs, and provides the legacy
    // "load_ipython_extension" function which is required for any notebook
    // extension.
    //
    entry: './src/extension.js',
    output: {
      filename: 'extension.js',
      path: path.resolve(__dirname, '../../beakerx/beakerx/static'),
      libraryTarget: 'amd'
    },
    module: {
      rules: rules
    },
    resolve: resolve,
    externals: [
      'services/config',
      'services/kernels/comm',
      'base/js/utils',
      'base/js/namespace',
      'base/js/events',
      'require',
      'base/js/dialog',
      'notebook/js/celltoolbar',
      'notebook/js/codecell'
    ],
    watchOptions: {
      ignored: /node_modules/
    },
    plugins: plugins
  },
  {// Bundle for the notebook containing the custom widget views and models
    //
    // This bundle contains the implementation for the custom widget views and
    // custom widget.
    // It must be an amd module
    //
    entry: './src/index.js',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, '../../beakerx/beakerx/static'),
      libraryTarget: 'amd'
    },
    module: {
      rules: rules
    },
    resolve: resolve,
    externals: externals,
    watchOptions: {
      ignored: /node_modules/
    },
    plugins: plugins
  },
  {// Embeddable beakerx bundle
    //
    // This bundle is generally almost identical to the notebook bundle
    // containing the custom widget views and models.
    //
    // The only difference is in the configuration of the webpack public path
    // for the static assets.
    //
    // It will be automatically distributed by unpkg to work with the static
    // widget embedder.
    //
    // The target bundle is always `dist/index.js`, which is the path required
    // by the custom widget embedder.
    //
    entry: './src/embed.js',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, './dist/'),
      libraryTarget: 'amd',
      publicPath: 'https://unpkg.com/' + package.name + '@' + package.version + '/dist/'
    },
    module: {
      rules: rules
    },
    resolve: resolve,
    externals: externals,
    plugins: plugins
  },
  {// Beakerx JupyterLab bundle
    //
    // This bundle is generally almost identical to the embeddable bundle
    //
    entry: './src/embed.js',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, '../lab/lib/'),
      libraryTarget: 'amd'
    },
    module: {
      rules: rules
    },
    resolve: resolve,
    externals: externals.concat([
      '@phosphor/widgets',
      '@phosphor/commands',
      '@phosphor/disposable',
      '@phosphor/messaging',
      '@jupyter-widgets/jupyterlab-manager',
      '@jupyterlab'
    ]),
    plugins: plugins
  },
  {
    // tree - notebook
    entry: './src/tree.js',
    output: {
      filename: 'tree.js',
      path: path.resolve(__dirname, '../../beakerx/beakerx/static'),
      libraryTarget: 'amd'
    },
    module: {
      rules: rules
    },
    resolve: resolve,
    externals: [
      'base/js/namespace',
      'require',
    ],
    watchOptions: {
      ignored: /node_modules/
    },
    plugins: plugins
  },
  {// BeakerXTree JupyterLab bundle
      entry: './src/tree-lab.ts',
      output: {
          filename: 'tree.js',
          path: path.resolve(__dirname, '../lab/lib/'),
          libraryTarget: 'amd'
      },
      module: {
          rules: rules
      },
      resolve: resolve,
      externals: externals.concat([
          '@phosphor/widgets',
          '@phosphor/commands',
          '@phosphor/messaging',
      ]),
      plugins: plugins
  },
];
