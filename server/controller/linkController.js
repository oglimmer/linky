
import winston from 'winston';
import requestRaw from 'request';
import { AllHtmlEntities } from 'html-entities';

import favicon from '../util/favicon';
import linkDao from '../dao/linkDao';
import tagDao from '../dao/tagDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import TagHierarchyLogic from '../logic/TagHierarchy';

import { DEFAULT_LINK } from '../../src/redux/DataModels';
import { removeTrailingSlash } from '../util/StringUtil';
import { UNTAGGED, ALL, RSS, READONLY_TAGS } from '../../src/util/TagRegistry';

// TAGS

const simpleWordRegex = new RegExp('^[a-z0-9]*$');
const split = tags => tags.split(' ').filter(e => simpleWordRegex.test(e));
const getTags = (rawTags) => { if (!rawTags) return [UNTAGGED]; return split(rawTags); };
const ensureAllTag = (tagsArr) => {
  if (tagsArr && !tagsArr.find(e => e.toLowerCase() === ALL)) {
    tagsArr.push('all');
  }
  return tagsArr;
};
const ensureRssTag = (tagsArr, rssUrl) => {
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
const rewriteFavicon = (rec) => {
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
const fixUrl = url => (url && !url.startsWith('http') ? `http://${url}` : url);
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
const getNextIndex = (tagHierarchy) => {
  const sortedRootElements = tagHierarchy
  .filter(e => e.parent === 'root')
  .sort((a, b) => (a.index < b.index ? 1 : (a.index === b.index ? 0 : -1)));
  if (sortedRootElements.size > 0) {
    return sortedRootElements.get(0).index + 1;
  }
  return 0;
};
/* eslint-enable no-nested-ternary */

function updateTagHierarchy(userid, tags) {
  TagHierarchyLogic.load(userid).then((tagHierarchyRec) => {
    tags.forEach((tag) => {
      if (!tagHierarchyRec.tree.find(e => e.name === tag)) {
        tagHierarchyRec.tree.push({
          name: tag,
          parent: 'root',
          index: getNextIndex(tagHierarchyRec.tree),
        });
      }
    });
    tagDao.insert(tagHierarchyRec);
  });
}

class CreateLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const url = fixUrl(this.req.body.url);
    const rssUrl = fixUrl(this.req.body.rssUrl);
    const tags = ensureRssTag(ensureAllTag(getTags(this.req.body.tags)), rssUrl);
    const { pageTitle, notes } = this.req.body;
    return resolveUrl(url, pageTitle)
      .then(({ linkUrl, title }) => favicon(linkUrl)
      .then((faviconUrl) => {
        this.data = Object.assign({}, DEFAULT_LINK, {
          type: 'link',
          tags,
          linkUrl,
          faviconUrl,
          rssUrl,
          pageTitle: title,
          notes,
        });
      }));
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return ['linkUrl'];
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      const { id } = yield linkDao.insert(this.data);
      this.data.id = id;
      rewriteFavicon(this.data);
      this.res.send(this.data);
      updateTagHierarchy(this.data.userid, this.data.tags);
      winston.loggers.get('application').debug('Create link id=%s to db: %j', id, this.data);
    } catch (err) {
      winston.loggers.get('application').error('Failed to create link. Error = %j', err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

class UpdateLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { linkid } = this.req.params;
    const linkUrl = fixUrl(this.req.body.url);
    const rssUrl = fixUrl(this.req.body.rssUrl);
    const tags = ensureRssTag(ensureAllTag(getTags(this.req.body.tags)), rssUrl);
    const { pageTitle, notes } = this.req.body;
    this.data = {
      linkid,
      tags,
      linkUrl,
      rssUrl,
      pageTitle,
      notes,
    };
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return ['linkUrl', 'linkid'];
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      const rec = yield linkDao.getById(this.data.linkid);
      const recToWrite = Object.assign({}, rec, {
        tags: this.data.tags,
        linkUrl: this.data.linkUrl,
        rssUrl: this.data.rssUrl,
        pageTitle: this.data.pageTitle,
        notes: this.data.notes,
      });
      yield linkDao.insert(recToWrite);
      /* eslint-disable no-underscore-dangle */
      recToWrite.id = recToWrite._id;
      rewriteFavicon(recToWrite);
      /* eslint-enable no-underscore-dangle */
      this.res.send(recToWrite);
      updateTagHierarchy(this.data.userid, this.data.tags);
      winston.loggers.get('application').debug('Update link: %j', recToWrite);
    } catch (err) {
      winston.loggers.get('application').error('Failed to create link. Error = %j', err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

class BatchUpdateLinkChangeTagProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const oldTagName = this.req.body.oldTagName.toLowerCase();
    const newTagName = this.req.body.newTagName.toLowerCase();
    this.data = {
      oldTagName,
      newTagName,
    };
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return ['oldTagName', 'newTagName'];
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      if (READONLY_TAGS.findIndex(e => e === this.data.oldTagName) === -1) {
        const rawRows = yield linkDao.listByUseridAndTag(this.data.userid, this.data.oldTagName);
        const docs = rawRows.map((row) => {
          const rec = row.value;
          const index = rec.tags.findIndex(e => e === this.data.oldTagName);
          rec.tags.splice(index, 1, this.data.newTagName);
          return rec;
        });
        linkDao.bulk({ docs });
        this.res.send('ok');
        winston.loggers.get('application').debug('Updated %i links from %s to %s', docs.length, this.data.oldTagName, this.data.newTagName);
      }
    } catch (err) {
      winston.loggers.get('application').error('Failed to create link. Error = %j', err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

class GetLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const tags = this.req.params.tags;
    // const tags = tagsStr.split(',');
    this.data = { tags };
  }

  * process() {
    try {
      const rows = yield linkDao.listByUseridAndTag(this.data.userid, this.data.tags);
      const responseArr = rows.map((row) => {
        const { _id, _rev, ...mappedRow } = row.value;
        mappedRow.id = _id;
        rewriteFavicon(mappedRow);
        return mappedRow;
      });
      this.res.send(responseArr);
      winston.loggers.get('application').debug('Get all links from db for user %s and tags %s resulted in %d rows', this.data.userid, this.data.tags, responseArr.length);
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

class DeleteProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return ['linkid'];
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      yield linkDao.deleteLatest(this.data.linkid, this.data.userid);
      this.res.send();
      winston.loggers.get('application').debug('Deleted link with id=%s', this.data.linkid);
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

export default {

  createLink: function createLink(req, res, next) {
    const crp = new CreateLinkProcessor(req, res, next);
    crp.doProcess();
  },

  updateLink: function updateLink(req, res, next) {
    const crp = new UpdateLinkProcessor(req, res, next);
    crp.doProcess();
  },

  batchModifyLinksForTag: function batchModifyLinksForTag(req, res, next) {
    const crp = new BatchUpdateLinkChangeTagProcessor(req, res, next);
    crp.doProcess();
  },

  getLinkCollection: function getLinkCollection(req, res, next) {
    const glp = new GetLinkProcessor(req, res, next);
    glp.doProcess();
  },

  deleteLink: function deleteLink(req, res, next) {
    const dp = new DeleteProcessor(req, res, next);
    dp.doProcess();
  },

};
