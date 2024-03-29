
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');

const serverPropsLoader = require('../server/util/serverPropsLoader');
const BuildInfo = require('../src/util/BuildInfo');
const { linkyPropertiesDefined } = require('../server/util/linkyproperties');

if (!linkyPropertiesDefined) {
  console.log('WARNING: environment variable LINKY_PROPERTIES not set! Using defaults.');
}

serverPropsLoader(BuildInfo);

console.log('Using webpack.prod.config.js');
// https://github.com/webpack/webpack/issues/2537
process.env.NODE_ENV = 'production';

module.exports = {

  bail: true,

  devtool: 'hidden-source-map',

  entry: [
    './dynamic-resources/css/bootstrap-theme.min.css',
    './dynamic-resources/css/styles.css',
    'ionicons/dist/css/ionicons.min.css',
    'babel-polyfill',
    './src/index.js',
    './static-resources/default.png',
    './static-resources/sub.png',
    './static-resources/favicon.ico',
    './static-resources/portal.html',
    './static-resources/preview.jpg',
  ],

  output: {
    path: path.join(__dirname, '../dist/static'),
    filename: 'js/bundle-[name]-[chunkhash].js',
    publicPath: '/static/',
  },

  plugins: [
    new GitRevisionPlugin({
      branch: true,
    }),
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
    new ExtractTextPlugin('css/[name]-[chunkhash].css'),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: module => module.context && module.context.indexOf('node_modules') !== -1,
    }),
    new HtmlWebpackPlugin({
      filename: 'index.ejs',
      template: '!!html-loader!dynamic-resources/index_template.html',
    }),
    new StringReplacePlugin(),
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
        test: /\.(jpg|jpeg|gif|png|ico|html)$/,
        exclude: /node_modules/,
        use: 'file-loader?name=[name].[ext]',
      },
      {
        test: /\.jsx?$/,
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: /\/\* CONSTANT_START [\w\d_]* \*\/["'=.\s\w\d]*\/\* CONSTANT_END \*\//ig,
              replacement: (match) => {
                const tmp1 = match.substring(match.indexOf('CONSTANT_START') + 14);
                const tmp2 = tmp1.trim();
                const tmp3 = tmp2.substring(0, tmp2.indexOf(' '));
                const varName = tmp3.trim();

                const tmp4 = tmp2.substring(tmp2.indexOf('*/') + 2);
                const defaultValue = tmp4.substring(0, tmp4.indexOf('/*'));

                if (varName === 'SHOW_USER_PASSWORD_FORM') {
                  return 'false';
                }

                if (varName === 'SERVER_PROPS_LOADER') {
                  const name = defaultValue.trim().substr(1, defaultValue.length - 2);
                  return `'${BuildInfo[name]}'`;
                }
                return defaultValue;
              },
            },
        ]}),
      },
    ],
  },
};
