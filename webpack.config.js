const Dotenv = require('dotenv-webpack');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => [{
  mode: argv.mode === 'production' ? 'production' : 'development',

  // This is necessary because Figma's 'eval' works differently than normal eval
  devtool: argv.mode === 'production' ? false : 'inline-source-map',

  entry: {
    main: './src/code.ts', // The entry point for your plugin code
  },

  module: {
    rules: [
      // Converts TypeScript code to JavaScript
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
    ],
  },

  // Webpack tries these extensions for you if you omit the extension like "import './file'"
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    mainFields: ['browser', 'module', 'main'],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'), // Compile into a folder called "dist"
  },

  // Adds the FEATURESET env variable from the command-line
  // Tells Webpack to generate "webview.html" and to inline "webview.ts" into it
  plugins: [
    new webpack.EnvironmentPlugin({
      FEATURESET: (env && env.featureset && env.featureset === 'public' ? 'public' : 'internal'),
    }),
    new Dotenv(),
  ],
},
{
  mode: argv.mode === 'production' ? 'production' : 'development',

  // This is necessary because Figma's 'eval' works differently than normal eval
  devtool: argv.mode === 'production' ? false : 'inline-source-map',

  entry: {
    ui: ['./src/GUI.ts'],
  },
  resolve: {
    alias: {
      svelte: path.resolve('node_modules', 'svelte'),
    },
    extensions: ['.mjs', '.js', '.svelte', '.ts'],
    mainFields: ['svelte', 'browser', 'module', 'main'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'), // Compile into a folder called "dist"
    filename: '[name].js',
    chunkFilename: '[name].[id].js',
  },
  module: {
    rules: [
      // Converts TypeScript code to JavaScript
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },

      // Loads svelte
      {
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader',
          options: {
            emitCss: true,
            hotReload: false,
          },
        },
      },

      // Enables including CSS by doing "import './file.css'" in your TypeScript code
      { test: /\.(s*)css$/, loader: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }] },

      // Allows you to use "<%= require('./file.svg') %>" in your HTML code to get a data URI
      { test: /\.(png|jpg|gif|webp|svg)$/, loader: [{ loader: 'url-loader' }] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/views/webview.html',
      filename: 'webview.html',
      inlineSource: '.(js)$',
      chunks: ['ui'],
    }),
    new HtmlWebpackInlineSourcePlugin(),
  ],
}];
