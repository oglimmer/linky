
const path = require('path');
const webpack = require('webpack');

console.log('Using webpack.dev.config.js');

module.exports = {

  devtool: 'cheap-module-eval-source-map',

  entry: [
    'webpack-hot-middleware/client',
    'react-hot-loader/patch',
    './build/polyfills',
    './src/index.js',
  ],

  output: {
    path: path.join(__dirname, '../static/js'),
    filename: 'bundle.js',
    publicPath: '/js/',
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],

  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        include: path.join(__dirname, '..'),
        loader: 'eslint-loader',
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: path.join(__dirname, '..'),
      },
    ],
  },

};
