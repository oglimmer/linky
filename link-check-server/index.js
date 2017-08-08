
// node -r babel-register -r babel-polyfill link-check-server

import request from 'request';
import BlueBirdPromise from 'bluebird';
import moment from 'moment';

import favicon from '../server/util/favicon';
import linkDao, { LinkDao } from '../server/dao/linkDao';
import tagDao from '../server/dao/tagDao';
import { URLUPDATED, BROKEN, LOCKED, DUEDATE, DUE } from '../src/util/TagRegistry';
import { dateRegex, getNextIndex, equalRelevant } from '../server/logic/Link';
import { init, hasTag } from '../server/logic/TagHierarchy';
import { CheckLinkDuplicateFinder } from '../server/util/DuplicateFinder';

const cloneAndPush = (arr, eleToPush) => {
  const clone = arr.slice(0);
  clone.push(eleToPush);
  return clone;
};

const updateFavicon = rec => favicon(rec.linkUrl).then((faviconUrl) => {
  const updateObj = {};
  if (faviconUrl && !equalRelevant(faviconUrl, rec.faviconUrl)) {
    console.log(`${new Date()}: favicon ${rec.faviconUrl} changed to ${faviconUrl}`);
    updateObj.faviconUrl = faviconUrl;
    updateObj.$$DIRTY$$ = true;
  }
  return Object.assign({}, rec, updateObj);
});


const updateUrl = rec => new Promise((resolve, reject) => {
  const url = rec.linkUrl;
  const httpGetCall = request.get({
    url,
    followAllRedirects: true,
    // timeout: 500,
  });
  const timeout = setTimeout(() => {
    httpGetCall.abort();
    console.log(`${new Date()}: call to ${rec.linkUrl} timed out`);
    reject(Object.assign({}, rec, {
      tags: cloneAndPush(rec.tags, BROKEN),
      $$DIRTY$$: true,
    }));
  }, 30000);
  httpGetCall.on('response', (response) => {
    clearTimeout(timeout);
    httpGetCall.abort();
    const newUrl = response.request.href;
    const updateObj = {};
    if (!(equalRelevant(newUrl, url))) {
      console.log(`${new Date()}: link ${url} changed to ${newUrl}`);
      updateObj.$$DIRTY$$ = true;
      updateObj.linkUrl = newUrl;
      updateObj.notes = `${rec.notes}. Updated url to ${newUrl}`;
      if (!hasTag(rec.tags, URLUPDATED)) {
        updateObj.tags = cloneAndPush(rec.tags, URLUPDATED);
      }
    }
    resolve(Object.assign({}, rec, updateObj));
  });
  httpGetCall.on('error', () => {
    console.log(`${new Date()}: found broken link ${url}`);
    httpGetCall.abort();
    clearTimeout(timeout);
    reject(Object.assign({}, rec, {
      tags: cloneAndPush(rec.tags, BROKEN),
      $$DIRTY$$: true,
    }));
  });
});

const changedUserId = new Set();
const duplicateFinder = new CheckLinkDuplicateFinder(changedUserId);

const persist = (rec) => {
  if (rec.$$DIRTY$$) {
    /* eslint-disable no-param-reassign */
    delete rec.$$DIRTY$$;
    /* eslint-enable no-param-reassign */
    console.log(`${new Date()}: link ${rec.linkUrl} persisted`);
    changedUserId.add(rec.userid);
    return linkDao.insert(rec);
  }
  return Promise.resolve(rec);
};

const processUrlFavicon = (rec) => {
  if (!hasTag(rec.tags, BROKEN) && !hasTag(rec.tags, LOCKED)) {
    return updateUrl(rec).then(updateFavicon).catch(r => r);
  }
  return Promise.resolve(rec);
};

const checkDue = (rec) => {
  const updateObj = {};
  if (hasTag(rec.tags, DUEDATE) && !hasTag(rec.tags, DUE)) {
    if (rec.tags.filter(tag => dateRegex.test(tag))
        .some(tag => moment(tag, 'YYYY-MM-DD').isBefore(moment()))) {
      console.log(`${new Date()}: link ${rec.linkUrl} was due.`);
      updateObj.tags = cloneAndPush(rec.tags, DUE);
      updateObj.$$DIRTY$$ = true;
    }
  }
  return Object.assign({}, rec, updateObj);
};

const processRow = (rec) => {
  duplicateFinder.counterLink(rec);
  return processUrlFavicon(rec).then(checkDue).then(persist);
};

const updateTagHierarchies = () => {
  changedUserId.forEach((userid) => {
    tagDao.getHierarchyByUser(userid).then((rec) => {
      if (rec) {
        return rec;
      }
      return init([]);
    }).then(rec => tagDao.listAllTags(userid).then((allTags) => {
      let dirty = false;
      allTags.filter(tag => !rec.tree.find(e => e.name === tag[0])).forEach((tag) => {
        console.log(`${new Date()}: adding ${tag[0]} for user ${userid}`);
        rec.tree.push({
          name: tag[0],
          parent: 'root',
          index: getNextIndex(rec.tree, 'root'),
        });
        dirty = true;
      });
      if (dirty) {
        tagDao.insert(rec);
        console.log(`${new Date()}: saved tagHierarchy for user ${userid}`);
      }
    }));
  });
};


const processRows = (recs) => {
  BlueBirdPromise.map(recs, processRow, { concurrency: 20 })
    .then(() => duplicateFinder.allLinksInSystem())
    .then(updateTagHierarchies);
};

console.log(`${new Date()}: starting link-check-server`);
LinkDao.listAll().then(processRows);

process.on('exit', () => {
  console.log(`${new Date()}: exiting link-check-server`);
});

