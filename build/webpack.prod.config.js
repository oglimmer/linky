
const path = require('path');
const webpack = require('webpack');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

console.log('Using webpack.prod.config.js');
// https://github.com/webpack/webpack/issues/2537
process.env.NODE_ENV = 'production';

module.exports = {

  bail: true,

  devtool: 'hidden-source-map',

  entry: [
    './static/css/bootstrap-theme.min.css',
    './static/favicon.ico',
    'babel-polyfill',
    './src/index.js',
  ],

  output: {
    path: path.join(__dirname, '../build/'),
    filename: 'js/bundle.js',
    publicPath: '/',
  },

  plugins: [
    new LodashModuleReplacementPlugin(),
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
    new ExtractTextPlugin('./css/[name].css'),
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
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        test: /\.(woff2?|ttf|eot|svg)$/,
        use: 'url-loader?limit=10000',
      },
      {
        test: /\.(jpg|jpeg|gif|png|ico)$/,
        exclude: /node_modules/,
        loader: 'file-loader?name=[name].[ext]',
      },
    ],
  },
};
