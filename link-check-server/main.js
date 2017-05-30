
import request from 'request';

import favicon from '../server/util/favicon';
import linkDao from '../server/dao/linkDao';
import { removeTrailingSlash } from '../server/util/StringUtil';

/* eslint-disable no-param-reassign */

const hasTag = (arr, tagName) => arr.find(e => e === tagName);

const process200 = (response, httpGetCall, url, rec) => {
  httpGetCall.abort();
  const linkUrl = removeTrailingSlash(response.request.href);
  favicon(linkUrl).then((faviconUrl) => {
    let changed = false;
    if (linkUrl !== url) {
      console.log(`${new Date()}: link ${url} changed to ${linkUrl}`);
      rec.linkUrl = linkUrl;
      if (!hasTag(rec.tags, 'urlupdated')) {
        rec.tags.push('urlupdated');
      }
      changed = true;
    }
    if (faviconUrl !== rec.faviconUrl) {
      console.log(`${new Date()}: favicon ${rec.faviconUrl} changed to ${faviconUrl}`);
      rec.faviconUrl = faviconUrl;
      changed = true;
    }
    if (changed) {
      linkDao.insert(rec);
    }
  });
};

const processError = (httpGetCall, url, rec) => {
  httpGetCall.abort();
  console.log(`${new Date()}: found broken link ${url}`);
  rec.tags.push('broken');
  linkDao.insert(rec);
};

const processRow = (rec) => {
  if (!hasTag(rec.tags, 'broken') && !hasTag(rec.tags, 'locked')) {
    const url = rec.linkUrl;
    const httpGetCall = request.get({
      url,
      followAllRedirects: true,
      // timeout: 500,
    });
    httpGetCall.on('response', response => process200(response, httpGetCall, url, rec));
    httpGetCall.on('error', () => processError(httpGetCall, url, rec));
  }
};

const processRows = (recs) => {
  recs.forEach(processRow);
};

console.log(`${new Date()}: starting link-check-server`);
linkDao.listAll().then(processRows);

process.on('exit', () => {
  console.log(`${new Date()}: exiting link-check-server`);
});

