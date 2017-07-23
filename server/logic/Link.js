
import requestRaw from 'request';
import { AllHtmlEntities } from 'html-entities';
import assert from 'assert';

import favicon from '../util/favicon';
import linkDao from '../dao/linkDao';

import { DEFAULT_LINK } from '../../src/redux/DataModels';
import { removeTrailingSlash } from '../util/StringUtil';
import { UNTAGGED, ALL, RSS } from '../../src/util/TagRegistry';

import tagDao from '../dao/tagDao';
import TagHierarchyLogic from '../logic/TagHierarchy';

// TAGS
const simpleWordRegex = new RegExp('^[a-z0-9]*$');

const split = tags => tags.split(' ').filter(e => simpleWordRegex.test(e));

export const getTags = (rawTags) => { if (!rawTags) return [UNTAGGED]; return split(rawTags); };

const getTagsFromArray = (tagsArray) => {
  if (tagsArray.length === 0) {
    return [UNTAGGED];
  }
  return tagsArray.filter(e => simpleWordRegex.test(e));
};

export const ensureAllTag = (tagsArr) => {
  if (tagsArr && !tagsArr.find(e => e.toLowerCase() === ALL)) {
    tagsArr.push('all');
  }
  return tagsArr;
};

export const ensureRssTag = (tagsArr, rssUrl) => {
  const findFctn = e => e.toLowerCase() === RSS;
  if (rssUrl && tagsArr && !tagsArr.find(findFctn)) {
    tagsArr.push('rss');
  }
  if (!rssUrl && tagsArr && tagsArr.find(findFctn)) {
    tagsArr.splice(tagsArr.findIndex(findFctn), 1);
  }
  return tagsArr;
};

// FAVICON
export const rewriteFavicon = (rec) => {
  const recToMod = rec;
  recToMod.faviconUrl = rec.faviconUrl && `https://linky.oglimmer.de/rest/links/${rec.id}/favicon`;
};

// URL
const isHtml = (response) => {
  const contentTypeHeader = response.headers['content-type'];
  if (!contentTypeHeader) {
    return false;
  }
  return contentTypeHeader.indexOf('text/html') === 0;
};

export const fixUrl = url => (url && !url.startsWith('http') ? `http://${url}` : url);

const resolveUrl = (url, pageTitle) => new Promise((resolve) => {
  const httpGetCall = requestRaw.get({
    url,
    followAllRedirects: true,
    timeout: 500,
  });
  let buffer = '';
  let title = pageTitle || url;
  let linkUrl = url;
  httpGetCall.on('response', (response) => {
    linkUrl = removeTrailingSlash(response.request.href);
    if (pageTitle || !isHtml(response)) {
      httpGetCall.abort();
      resolve({ linkUrl, title });
    }
  });
  httpGetCall.on('data', (data) => {
    const html = data.toString().replace(/[\n\r]/g, '');
    buffer += html;
    const findTitleRegEx = new RegExp('<title>(.*?)</title>', 'g');
    const match = findTitleRegEx.exec(buffer);
    if (match && match.length > 1) {
      const entities = new AllHtmlEntities();
      title = entities.decode(match[1]);
      httpGetCall.abort();
      resolve({ linkUrl, title });
    }
  });
  httpGetCall.on('complete', () => {
    resolve({ linkUrl, title });
  });
  httpGetCall.on('error', () => {
    httpGetCall.abort();
    resolve({ linkUrl, title });
  });
});

/* eslint-disable no-nested-ternary */
const getNextIndex = (tagHierarchy, parent = 'root') => {
  const sortedRootElements = tagHierarchy
    .filter(e => e.parent === parent)
    .sort((a, b) => (a.index < b.index ? 1 : (a.index === b.index ? 0 : -1)));
  // Immutable classes don't have length. We expect a POJO [] here.
  assert(typeof sortedRootElements.length === 'number');
  if (sortedRootElements.length > 0) {
    return sortedRootElements[0].index + 1;
  }
  return 0;
};
/* eslint-enable no-nested-ternary */

export function updateTagHierarchy(userid, tags, parent = 'root') {
  return TagHierarchyLogic.load(userid, parent).then((tagHierarchyRec) => {
    if (parent !== 'root' && tagHierarchyRec.tree.findIndex(e => e.name === parent) === -1) {
      tagHierarchyRec.tree.push({
        name: parent,
        parent: 'root',
        index: getNextIndex(tagHierarchyRec.tree),
      });
    }
    tags.forEach((tag) => {
      if (!tagHierarchyRec.tree.find(e => e.name === tag)) {
        tagHierarchyRec.tree.push({
          name: tag,
          parent,
          index: getNextIndex(tagHierarchyRec.tree, parent),
        });
      }
    });
    return tagDao.insert(tagHierarchyRec);
  });
}

export const createRecord = (rec) => {
  const { url, rssUrl, tagsAsString, tagsAsArray, pageTitle, notes } = rec;
  const fixedUrl = fixUrl(url);
  const fixedRssUrl = fixUrl(rssUrl);
  const fixedTags = Object.prototype.hasOwnProperty.call(rec, 'tagsAsString') ? getTags(tagsAsString) : getTagsFromArray(tagsAsArray);
  const tags = ensureRssTag(ensureAllTag(fixedTags), fixedRssUrl);
  return resolveUrl(fixedUrl, pageTitle)
    .then(({ linkUrl, title }) => favicon(linkUrl)
    .then(faviconUrl => Object.assign({}, DEFAULT_LINK, {
      type: 'link',
      tags,
      linkUrl,
      faviconUrl,
      rssUrl: fixedRssUrl,
      pageTitle: title,
      notes,
    }),
  ));
};

export const presistRecord = rec => linkDao.insert(rec);
