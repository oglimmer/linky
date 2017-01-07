var debug = process.env.NODE_ENV === "debug";

var path = require('path');
var webpack = require('webpack');

var BASE_DIR = path.resolve(__dirname, 'src/client');
var BUILD_DIR = BASE_DIR + '/dist';
var APP_DIR = BASE_DIR + '/app';


module.exports = {
  context: BASE_DIR,
  devtool: debug ? "inline-sourcemap" : null,
  entry: APP_DIR + '/main.jsx',
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js',
    publicPath: '/dist'
  },
  debug: true,
  resolve: {
    extensions: ['', '.js', '.jsx'],
    modulesDirectories: [
      'node_modules'
    ]
  },
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react', 'stage-0'],
          plugins: ['react-html-attrs', 'transform-class-properties', 'transform-decorators-legacy']
        }
      },
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.jpg$/, loader: "file-loader" },
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
    ]
  },
  plugins: debug ? [] : [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
  ],
  devServer: {
    proxy: {
      '/rest': {
        target: 'http://localhost:8088',
        secure: false
      }
    }
  }
};
