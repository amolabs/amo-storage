const path = require('path');
const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
require('dotenv').config();

module.exports = (env, options) => {
  let isProductionMode = (env && env.production) || options.mode === 'production' || process.env.production === 'true' || false;
  let devtool;
  const plugins = [new MiniCssExtractPlugin({ filename: 'app.css' })];

  if (isProductionMode) {
    isProductionMode = 'production';
    devtool = false;
    plugins.push(new CleanWebpackPlugin());
  } else {
    isProductionMode = 'development';
    devtool = 'inline-source-map';
  }

  return {
    mode: isProductionMode,
    target: 'node',
    // externals: [nodeExternals()],
    devtool,
    entry: './src/index',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: '[name].bundle.js',
      sourceMapFilename: '[file].map',
      publicPath: '/',
    },
    devServer: {
      hot: true,
      host: 'localhost',
      port: 8080,
      contentBase: path.resolve(__dirname, 'build'),
    },
    resolve: {
      modules: [path.join(__dirname, 'src'), 'node_modules'],
      extensions: ['.ts', '.tsx', '.js', '.json'],
      plugins: [new TsconfigPathsPlugin()],
    },
    module: {
      rules: [
        {
          // Include ts, tsx, js, and jsx files.
          test: /\.(ts|js)x?$/,
          exclude: /node_modules/,
          loader: 'ts-loader',
        },
      ],
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    },
    plugins,
  };
};