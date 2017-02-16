
const path = require('path');
const webpack = require('webpack');

console.log('Using webpack.prod.config.js');
// https://github.com/webpack/webpack/issues/2537
process.env.NODE_ENV = 'production';

module.exports = {

  bail: true,

  devtool: 'hidden-source-map',

  entry: [
    './build/polyfills',
    './src/index.js',
  ],

  output: {
    path: path.join(__dirname, '../static/js'),
    filename: 'bundle.js',
    publicPath: '/js/',
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        screw_ie8: true, // React doesn't support IE8
        warnings: false,
      },
      mangle: {
        screw_ie8: true,
      },
      output: {
        comments: false,
        screw_ie8: true,
      },
      // https://github.com/webpack/webpack/issues/1385
      sourceMap: true,
    }),
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
