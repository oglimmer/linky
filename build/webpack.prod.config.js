
const path = require('path');
const webpack = require('webpack');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

console.log('Using webpack.prod.config.js');
// https://github.com/webpack/webpack/issues/2537
process.env.NODE_ENV = 'production';

module.exports = {

  bail: true,

  devtool: 'hidden-source-map',

  entry: {
    main: [
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
    path: path.join(__dirname, '../dist/'),
    filename: 'js/bundle-[name]-[chunkhash].js',
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
    new ExtractTextPlugin('./css/[name]-[chunkhash].css'),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function (module) {
        // this assumes your vendor imports exist in the node_modules directory
        return module.context && module.context.indexOf('node_modules') !== -1;
      }
    }),
    new HtmlWebpackPlugin({
      filename: 'index.ejs',
      template: '!!html-loader!static/index_template.html',
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
