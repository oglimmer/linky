
const path = require('path');
const webpack = require('webpack');

module.exports = {

  devtool: '#inline-source-map',

  entry: [
    'webpack-hot-middleware/client',
    require.resolve('./polyfills'),
    './src/index.js',
  ],

  output: {
    path: path.join(__dirname, '../static/js'),
    filename: 'bundle.js',
    publicPath: '/js/',
  },

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ],

  resolve: {
    alias: {},
    extensions: ['', '.js'],
  },

  module: {
    preLoaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'eslint',
        exclude: /node_modules/,
        include: path.join(__dirname, '..'),
      },
    ],
    loaders: [{
      test: /\.jsx?$/,
      loader: 'babel',
      exclude: /node_modules/,
      include: path.join(__dirname, '..'),
      query: {
        presets: ['react-hmre', 'es2015', 'stage-0', 'react'],
      },
    }, {
      test: /\.css$/,
      loader: 'style!css',
    }],
  },
};
