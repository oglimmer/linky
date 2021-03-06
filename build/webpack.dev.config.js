
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');

const BuildInfo = require('../src/util/BuildInfo');

console.log('Using webpack.dev.config.js');

module.exports = {

  devtool: 'source-map',

  entry: [
    './dynamic-resources/css/bootstrap-theme.min.css',
    './dynamic-resources/css/styles.css',
    'ionicons/dist/css/ionicons.min.css',
    'react-hot-loader/patch',
    'webpack-hot-middleware/client',
    'babel-polyfill',
    './src/index.js',
  ],

  output: {
    path: path.join(__dirname, '../static-resources/'),
    filename: 'js/bundle-[name].js',
    publicPath: '/static/',
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new ExtractTextPlugin('./css/[name].css'),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: module => module.context && module.context.indexOf('node_modules') !== -1,
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
        test: /\.(jpg|jpeg|gif|png|ico)$/,
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
                  return 'true';
                }

                if (varName === 'SERVER_PROPS_LOADER') {
                  const name = defaultValue.trim().substr(1, defaultValue.length - 2);
                  return `'${BuildInfo[name]}'`;
                }

                console.log(`Failed to replace source code constant ${varName} using default ${defaultValue}`);
                return defaultValue;
              },
            },
        ]}),
      },
    ],
  },

};
