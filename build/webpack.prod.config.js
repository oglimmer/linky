
const path = require('path');
const webpack = require('webpack');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const execSync = require('child_process').execSync;

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
    path: path.join(__dirname, '../dist/'),
    filename: 'js/bundle-[name]-[chunkhash].js',
    publicPath: '/',
  },

  plugins: [
    new GitRevisionPlugin(),
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
      minChunks: module => module.context && module.context.indexOf('node_modules') !== -1,
    }),
    new HtmlWebpackPlugin({
      filename: 'index.ejs',
      template: '!!html-loader!static/index_template.html',
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
              pattern: /\/\* CONSTANT_START [\w\d_]* \*\/["'\s\w\d]*\/\* CONSTANT_END \*\//ig,
              replacement: (match) => {
                const tmp1 = match.substring(match.indexOf('CONSTANT_START') + 14);
                const tmp2 = tmp1.trim();
                const tmp3 = tmp2.substring(0, tmp2.indexOf(' '));
                const varName = tmp3.trim();

                const tmp4 = tmp2.substring(tmp2.indexOf('*/') + 2);
                const defaultValue = tmp4.substring(0, tmp4.indexOf('/*'));

                if (varName === 'COOKIE_SECURE') {
                  return 'true';
                }
                if (varName === 'GIT_COMMIT_HASH') {
                  const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 7);
                  return `'${hash}'`;
                }
                if (varName === 'GIT_BRANCHNAME') {
                  const branchname = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
                  return `'${branchname}'`;
                }
                if (varName === 'BUILDDATE') {
                  const now = new Date();
                  return `'${now}'`;
                }
                return defaultValue;
              },
            },
        ]}),
      },
    ],
  },
};
