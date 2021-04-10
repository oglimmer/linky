// node -r babel-register -r babel-polyfill link-check-server

import BlueBirdPromise from 'bluebird';
import moment from 'moment';
import axios from 'axios';

import favicon from '../server/util/favicon';
import linkDao from '../server/dao/linkDao';
import tagDao from '../server/dao/tagDao';
import { URLUPDATED, BROKEN, LOCKED, DUEDATE, DUE } from '../src/util/TagRegistry';
import { dateRegex, getNextIndex, equalRelevant } from '../server/logic/Link';
import { init, hasTag } from '../server/logic/TagHierarchy';
import { CheckLinkDuplicateFinder } from '../server/util/DuplicateFinder';

const getNow = () => new Date().toISOString();

const cloneAndPush = (arr, eleToPush) => {
  const clone = arr.slice(0);
  clone.push(eleToPush);
  return clone;
};

const removeElement = (arr, eleToPush) => {
  return arr.filter(e => e != eleToPush);
}

const updateFavicon = async (rec) => {
  const faviconUrl = await favicon(rec.linkUrl);
  const updateObj = {};
  if (faviconUrl && !equalRelevant(faviconUrl, rec.faviconUrl)) {
    console.log(`${getNow()}: favicon ${rec.faviconUrl} changed to ${faviconUrl}`);
    updateObj.faviconUrl = faviconUrl;
    updateObj.$$DIRTY$$ = true;
  }
  return Object.assign({}, rec, updateObj);
};


const updateUrl = async rec => {  
  const url = rec.linkUrl;
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const newUrl = response.request.res.responseUrl;
    const updateObj = {};
    if (!(equalRelevant(newUrl, url))) {
      console.log(`${getNow()}: link ${url} changed to ${newUrl}`);
      updateObj.$$DIRTY$$ = true;
      updateObj.linkUrl = newUrl;
      updateObj.notes = `${rec.notes}. Updated url to ${newUrl}`;
      if (!hasTag(rec.tags, URLUPDATED)) {
        updateObj.tags = cloneAndPush(rec.tags, URLUPDATED);
      }
    }
    if (hasTag(rec.tags, BROKEN)) {
      console.log(`${getNow()}: link ${url} removed BROKEN`);
      updateObj.$$DIRTY$$ = true;
      updateObj.tags = removeElement(rec.tags, BROKEN);
    }
  return Object.assign({}, rec, updateObj);
  } catch (err) {
    if (!hasTag(rec.tags, BROKEN)) {
      console.log(`${getNow()}: found broken link ${url}`);
      return Object.assign({}, rec, {
        tags: cloneAndPush(rec.tags, BROKEN),
        $$DIRTY$$: true,
      });
    } else {
      console.log(`${getNow()}: found broken link ${url} but already marked as BROKEN`);
      return rec;
    }
  }
};

const changedUserId = new Set();
const duplicateFinder = new CheckLinkDuplicateFinder(changedUserId);

const persist = async (rec) => {
  if (rec.$$DIRTY$$) {
    /* eslint-disable no-param-reassign */
    delete rec.$$DIRTY$$;
    /* eslint-enable no-param-reassign */
    console.log(`${getNow()}: link ${rec.linkUrl} persisted`);
    changedUserId.add(rec.userid);
    return await linkDao.insert(rec);
  }
  return rec;
};

const processUrlAndFavicon = async (rec) => {
  if (!hasTag(rec.tags, LOCKED)) {
    if (!hasTag(rec.tags, BROKEN)) {
      // nothing ;)
    }
    try {
      rec = await updateUrl(rec);
      rec = await updateFavicon(rec);
    } catch (err) {
      console.log(err)
      // ignore this
    }
  }
  return rec;
};

const checkDue = (rec) => {
  const updateObj = {};
  if (hasTag(rec.tags, DUEDATE) && !hasTag(rec.tags, DUE)) {
    if (rec.tags.filter(tag => dateRegex.test(tag))
      .some(tag => moment(tag, 'YYYY-MM-DD').isBefore(moment()))) {
      console.log(`${getNow()}: link ${rec.linkUrl} was due.`);
      updateObj.tags = cloneAndPush(rec.tags, DUE);
      updateObj.$$DIRTY$$ = true;
    }
  }
  return Object.assign({}, rec, updateObj);
};

const processRow = async (rec) => {
  duplicateFinder.counterLink(rec);
  rec = await processUrlAndFavicon(rec);
  rec = await checkDue(rec);
  rec = await persist(rec);
  return rec;
};

const updateTagHierarchies = () => {
  changedUserId.forEach(async (userid) => {
    let rec = await tagDao.getHierarchyByUser(userid);
    if (!rec) {
      rec = createTagHierarchy(userid, init([]));
    }
    const allTags = await tagDao.listAllTags(userid);
    let dirty = false;
    allTags.filter(tag => !rec.tree.find(e => e.name === tag[0])).forEach((tag) => {
      console.log(`${getNow()}: adding ${tag[0]} for user ${userid}`);
      rec.tree.push({
        name: tag[0],
        parent: 'root',
        index: getNextIndex(rec.tree, 'root'),
      });
      dirty = true;
    });
    if (dirty) {
      await tagDao.insert(rec);
      console.log(`${getNow()}: saved tagHierarchy for user ${userid}`);
    }
  });
};

const processRows = async (recs) => {
  console.log(`${getNow()}: found ${recs.length} records in DB...`)
  await BlueBirdPromise.map(recs, processRow, { concurrency: 20 });
  console.log(`${getNow()}: initial processing completed for ${duplicateFinder.allLinks.size} users`)
  await duplicateFinder.allLinksInSystem();
  console.log(`${getNow()}: duplicateFinder completed with allLinksInSystem()`)
  updateTagHierarchies();
};

process.on('exit', () => {
  console.log(`${getNow()}: exiting link-check-server`);
});

(async () => {
  console.log(`${getNow()}: starting link-check-server`);
  const allRecords = await linkDao.listAll();  
  processRows(allRecords);
})();

