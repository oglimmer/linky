
import request from 'request';

import linkDao from '../server/dao/linkDao';
import { removeTrailingSlash } from '../server/util/StringUtil';

const hasTag = (rec, tagName) => rec.tags.find(e => e === tagName);

const process200 = (response, httpGetCall, url, rec) => {
  httpGetCall.abort();
  const linkUrl = removeTrailingSlash(response.request.href);
  if (linkUrl !== url) {
    console.log(`${new Date()}: link ${url} changed to ${linkUrl}`);
    /* eslint-disable no-param-reassign */
    rec.linkUrl = linkUrl;
    /* eslint-enable no-param-reassign */
    if (!hasTag(rec.tags, 'urlupdated')) {
      rec.tags.push('urlupdated');
    }
    linkDao.insert(rec);
  }
};

const processError = (httpGetCall, url, rec) => {
  httpGetCall.abort();
  console.log(`${new Date()}: found broken link ${url}`);
  rec.tags.push('broken');
  linkDao.insert(rec);
};

const processRow = (rec) => {
  if (!hasTag(rec, 'broken')) {
    const url = rec.linkUrl;
    const httpGetCall = request.get({
      url,
      followAllRedirects: true,
      timeout: 500,
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

