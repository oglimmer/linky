
// node -r babel-register -r babel-polyfill link-check-server

import request from 'request';
import BlueBirdPromise from 'bluebird';

import favicon from '../server/util/favicon';
import linkDao, { LinkDao } from '../server/dao/linkDao';
import { removeTrailingSlash } from '../server/util/StringUtil';

/* eslint-disable no-param-reassign */

const hasTag = (arr, tagName) => arr.find(e => e === tagName);

const process200 = (response, httpGetCall, url, rec) => {
  httpGetCall.abort();
  const linkUrl = removeTrailingSlash(response.request.href);
  return favicon(linkUrl).then((faviconUrl) => {
    let changed = false;
    if (linkUrl !== url) {
      console.log(`${new Date()}: link ${url} changed to ${linkUrl}`);
      rec.linkUrl = linkUrl;
      if (!hasTag(rec.tags, 'urlupdated')) {
        rec.tags.push('urlupdated');
      }
      changed = true;
    }
    if (faviconUrl && faviconUrl !== rec.faviconUrl) {
      console.log(`${new Date()}: favicon ${rec.faviconUrl} changed to ${faviconUrl}`);
      rec.faviconUrl = faviconUrl;
      changed = true;
    }
    if (changed) {
      return linkDao.insert(rec);
    }
    return Promise.resolve();
  });
};

const processError = (httpGetCall, url, rec) => {
  httpGetCall.abort();
  console.log(`${new Date()}: found broken link ${url}`);
  rec.tags.push('broken');
  return linkDao.insert(rec);
};

const processRow = rec => new Promise((resolve) => {
  if (!hasTag(rec.tags, 'broken') && !hasTag(rec.tags, 'locked')) {
    const url = rec.linkUrl;
    const httpGetCall = request.get({
      url,
      followAllRedirects: true,
      // timeout: 500,
    });
    const timeout = setTimeout(() => {
      console.log(`${new Date()}: call to ${rec.linkUrl} timed out`);
      processError(httpGetCall, url, rec).then(() => resolve());
    }, 5000);
    httpGetCall.on('response', (response) => {
      clearTimeout(timeout);
      process200(response, httpGetCall, url, rec).then(() => resolve());
    });
    httpGetCall.on('error', () => {
      clearTimeout(timeout);
      processError(httpGetCall, url, rec).then(() => resolve());
    });
  }
});


const processRows = (recs) => {
  BlueBirdPromise.map(recs, processRow, { concurrency: 20 });
};

console.log(`${new Date()}: starting link-check-server`);
LinkDao.listAll().then(processRows);

process.on('exit', () => {
  console.log(`${new Date()}: exiting link-check-server`);
});

