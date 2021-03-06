
/* eslint-disable one-var */
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */

let tryWebpack, tryWebpackDevMiddleware, tryWebpackHotMiddleware, tryEmptyCache = {}, tryProxy;

if (process.env.NODE_ENV === 'development') {
  tryWebpack = require('webpack');
  tryWebpackDevMiddleware = require('webpack-dev-middleware');
  tryWebpackHotMiddleware = require('webpack-hot-middleware');
  tryEmptyCache = require('./util/reload');
  tryProxy = require('express-http-proxy');
}

export const webpack = tryWebpack;
export const webpackDevMiddleware = tryWebpackDevMiddleware;
export const webpackHotMiddleware = tryWebpackHotMiddleware;
export const { emptyCache } = tryEmptyCache;
export const proxy = tryProxy;

export default {
  webpack,
  webpackDevMiddleware,
  webpackHotMiddleware,
  emptyCache,
  proxy,
};
