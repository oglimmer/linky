
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

console.log('Using webpack.dev.config.js');

module.exports = {

  devtool: 'cheap-module-eval-source-map',

  entry: {
    main: [
      'react-hot-loader/patch',
      'webpack-hot-middleware/client',
      'babel-polyfill',
      './src/index.js',
    ],
    vendor: [
      './static/css/bootstrap-theme.min.css',
      './static/favicon.ico',
      'lodash',
      'react',
      'redux',
      'react-redux',
      'react-redux-form',
      'react-bootstrap',
      'js-cookie',
      'redux-thunk',
      'redux-logger',
      'isomorphic-fetch',
      'react-dom',
      'react-hot-loader',
    ],
  },

  output: {
    path: path.join(__dirname, '../static/'),
    filename: 'js/bundle-[name].js',
    publicPath: '/',
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new ExtractTextPlugin('./css/[name].css'),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
    }),
  ],

  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        include: path.join(__dirname, '..'),
        use: 'eslint-loader',
      },
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
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
        use: 'file-loader?name=[name].[ext]',
      },
    ],
  },

};
