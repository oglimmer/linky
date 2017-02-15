
const path = require('path');
const webpack = require('webpack');

module.exports = {

  entry: [
    require.resolve('./polyfills'),
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
    // This helps ensure the builds are consistent if source hasn't changed
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
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
    }),
  ],

  resolve: {
    alias: {},
    extensions: ['', '.js'],
  },

  module: {
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
