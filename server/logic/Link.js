
import requestRaw from 'request';
import { AllHtmlEntities } from 'html-entities';
import assert from 'assert';

import favicon from '../util/favicon';
import linkDao from '../dao/linkDao';

import { DEFAULT_LINK } from '../../src/redux/DataModels';
import { UNTAGGED, ALL, RSS, FORBIDDEN_TAGS, LOCKED, DUEDATE,
  ARCHIVE } from '../../src/util/TagRegistry';

import tagDao from '../dao/tagDao';
import TagHierarchyLogic from '../logic/TagHierarchy';

import properties from '../util/linkyproperties';

// TAGS
export const simpleWordRegex = new RegExp('^[a-z0-9-]*$');
export const dateRegex = new RegExp('^[\\d]{4}-[\\d]{2}-[\\d]{2}$');

const split = tags => tags.toLowerCase().split(' ').filter(e => simpleWordRegex.test(e));

export const getTags = (rawTags) => { if (!rawTags) return [UNTAGGED]; return split(rawTags); };

const getTagsFromArray = (tagsArray) => {
  if (tagsArray.length === 0) {
    return [UNTAGGED];
  }
  return tagsArray.filter(e => simpleWordRegex.test(e));
};

const toLowerCase = arr => arr.map(t => t.toLowerCase());

const ensureAllTag = (tagsArr) => {
  if (tagsArr && !tagsArr.find(e => e === ALL)) {
    tagsArr.push(ALL);
  }
  return tagsArr;
};

const ensureRssTag = (tagsArr, rssUrl) => {
  const findFctn = e => e === RSS;
  if (rssUrl && tagsArr && !tagsArr.find(findFctn)) {
    tagsArr.push(RSS);
  }
  if (!rssUrl && tagsArr && tagsArr.find(findFctn)) {
    tagsArr.splice(tagsArr.findIndex(findFctn), 1);
  }
  return tagsArr;
};

const ensureArchiveTag = (tagsArr, linkUrl) => {
  const findFctn = t => t === ARCHIVE;
  if (linkUrl.startsWith(`https://${properties.server.archive.domain}/`)) {
    if (tagsArr && !tagsArr.find(findFctn)) {
      tagsArr.push(ARCHIVE);
    }
  } else if (tagsArr && tagsArr.find(findFctn)) {
    tagsArr.splice(tagsArr.findIndex(findFctn), 1);
  }
  return tagsArr;
};

const ensureWithduedateTag = (tagsArr) => {
  if (tagsArr.find(e => dateRegex.test(e)) && !tagsArr.find(e => e === DUEDATE)) {
    tagsArr.push(DUEDATE);
  } else if (!tagsArr.find(e => dateRegex.test(e)) && tagsArr.find(e => e === DUEDATE)) {
    tagsArr.splice(tagsArr.findIndex(e => e === DUEDATE), 1);
  }
  return tagsArr;
};

const removeForbiddenTags = tagsArray =>
  tagsArray.filter(e => !FORBIDDEN_TAGS.find(t => t === e));

// URL

export const purifyLink = (link) => {
  const noTrailingSlash = str => (str.endsWith('/') ? str.substr(0, str.length - 1) : str);
  const noHttpProtocol = str => (str.startsWith('http://') ? str.substr('http://'.length) : str);
  const noHttpsProtocol = str => (str.startsWith('https://') ? str.substr('https://'.length) : str);
  const noProtocol = str => noHttpsProtocol(noHttpProtocol(str));
  return noProtocol(noTrailingSlash(link));
};

export const equalRelevant = (strA, strB) => {
  if (!strA && !strB) {
    return true;
  }
  if ((!strA && !!strB) || (!!strA && !strB)) {
    return false;
  }
  if (strA === strB) {
    return true;
  }
  return purifyLink(strA) === purifyLink(strB);
};

const isHtml = (response) => {
  const contentTypeHeader = response.headers['content-type'];
  if (!contentTypeHeader) {
    return false;
  }
  return contentTypeHeader.indexOf('text/html') === 0;
};

export const fixUrl = url => (url && !url.startsWith('http') ? `http://${url}` : url);

const resolveUrl = (url, pageTitle, locked) => new Promise((resolve, reject) => {
  const httpGetCall = requestRaw.get({
    url,
    followAllRedirects: true,
    timeout: 500,
  });
  const timeout = setTimeout(() => {
    httpGetCall.abort();
    // we need to reject this, as the subsequent request to get the favicon/title would fail as well
    reject('Processing failed as socket received');
  }, 2500);
  const doresolve = ({ linkUrl, title }) => {
    clearTimeout(timeout);
    if (locked) {
      resolve({ linkUrl: url, title: pageTitle || url });
    } else {
      resolve({ linkUrl, title });
    }
  };
  let buffer = '';
  let title = pageTitle || url;
  let linkUrl = url;
  httpGetCall.on('response', (response) => {
    linkUrl = response.request.href;
    if (pageTitle || !isHtml(response)) {
      httpGetCall.abort();
      doresolve({ linkUrl, title });
    }
  });
  httpGetCall.on('data', (data) => {
    const html = data.toString().replace(/[\n\r]/g, '');
    buffer += html;
    const findTitleRegEx = new RegExp('<title>(.*?)</title>', 'g');
    const match = findTitleRegEx.exec(buffer);
    if (match && match.length > 1) {
      const entities = new AllHtmlEntities();
      const titleFromHtml = entities.decode(match[1]);
      if (titleFromHtml.length > 255) {
        title = `${titleFromHtml.substring(0, 255)}...`;
      } else if (titleFromHtml) {
        title = titleFromHtml;
      }
      httpGetCall.abort();
      doresolve({ linkUrl, title });
    }
  });
  httpGetCall.on('complete', () => {
    doresolve({ linkUrl, title });
  });
  httpGetCall.on('error', () => {
    httpGetCall.abort();
    doresolve({ linkUrl, title });
  });
});

/* eslint-disable no-nested-ternary */
export const getNextIndex = (tagHierarchy, parent = 'root') => {
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

export const createObject = ({ tags, linkUrl, faviconUrl, rssUrl, pageTitle, notes, userid }) =>
  Object.assign({}, DEFAULT_LINK, {
    type: 'link',
    tags,
    linkUrl,
    faviconUrl,
    rssUrl,
    pageTitle,
    notes,
    userid,
  });

export const validateAndEnhanceTags = (tags, rssUrl, linkUrl) =>
  ensureArchiveTag( // add archive if url starts with https://${properties.server.archive.domain}
    ensureWithduedateTag( // add duedate if date given
      ensureRssTag( // add rss if rss-url given
        ensureAllTag( // ensure all
          removeForbiddenTags( // remove user added forbidden tags
            toLowerCase(tags), // all to lower case
          ),
        ), rssUrl,
      ),
    ), linkUrl,
  );

export const createRecord = (rec, userid) => {
  const { url, rssUrl, tagsAsString, tagsAsArray, pageTitle, notes } = rec;
  const fixedUrl = fixUrl(url);
  const fixedRssUrl = fixUrl(rssUrl);
  const fixedTags = Object.prototype.hasOwnProperty.call(rec, 'tagsAsString') ? getTags(tagsAsString) : getTagsFromArray(tagsAsArray);
  const tags = validateAndEnhanceTags(fixedTags, fixedRssUrl, fixedUrl);
  const locked = !!tags.find(t => t === LOCKED);
  return resolveUrl(fixedUrl, pageTitle, locked)
    .then(({ linkUrl, title }) => favicon(linkUrl)
      .then(faviconUrl => createObject({
        tags,
        linkUrl,
        faviconUrl,
        rssUrl: fixedRssUrl,
        pageTitle: title,
        notes,
        userid,
      })),
    )
    .catch(() => createObject({
      tags,
      linkUrl: fixedUrl,
      rssUrl: fixedRssUrl,
      pageTitle: fixedUrl,
      notes,
      userid,
    }));
};

export const presistRecord = rec => linkDao.insert(rec);
