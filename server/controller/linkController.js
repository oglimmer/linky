
import winston from 'winston';
import requestRaw from 'request';

import favicon from '../util/favicon';
import linkDao from '../dao/linkDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

import { DEFAULT_LINK } from '../../src/redux/DataModels';
import { removeTrailingSlash } from '../util/StringUtil';

// TAGS

const simpleWordRegex = new RegExp('^[a-z0-9]*$');
const split = tags => tags.split(' ').filter(e => simpleWordRegex.test(e));
const getTags = (rawTags) => { if (!rawTags) return ['untagged']; return split(rawTags); };
const ensureAllTag = (tagsArr) => {
  if (tagsArr && !tagsArr.find(e => e.toLowerCase() === 'all')) {
    tagsArr.push('all');
  }
  return tagsArr;
};

// URL
const fixUrl = url => (url && !url.startsWith('http') ? `http://${url}` : url);
const resolveUrl = url => new Promise((resolve) => {
  const httpGetCall = requestRaw.get({
    url,
    followAllRedirects: true,
    timeout: 500,
  });
  httpGetCall.on('response', (response) => {
    httpGetCall.abort();
    const linkUrl = removeTrailingSlash(response.request.href);
    resolve(linkUrl);
  });
  httpGetCall.on('error', () => {
    httpGetCall.abort();
    resolve(url);
  });
});

class CreateLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const url = fixUrl(this.req.body.url);
    const rssUrl = fixUrl(this.req.body.rssUrl);
    const tags = ensureAllTag(getTags(this.req.body.tags));
    return resolveUrl(url).then(linkUrl => favicon(linkUrl).then((faviconUrl) => {
      this.data = Object.assign({}, DEFAULT_LINK, {
        type: 'link',
        tags,
        linkUrl,
        faviconUrl,
        rssUrl,
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
      this.res.send(this.data);
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
    const tags = ensureAllTag(getTags(this.req.body.tags));
    this.data = {
      linkid,
      tags,
      linkUrl,
      rssUrl,
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
      });
      yield linkDao.insert(recToWrite);
      /* eslint-disable no-underscore-dangle */
      recToWrite.id = recToWrite._id;
      /* eslint-enable no-underscore-dangle */
      this.res.send(recToWrite);
      winston.loggers.get('application').debug('Update link: %j', recToWrite);
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

  getLinkCollection: function getLinkCollection(req, res, next) {
    const glp = new GetLinkProcessor(req, res, next);
    glp.doProcess();
  },

  deleteLink: function deleteLink(req, res, next) {
    const dp = new DeleteProcessor(req, res, next);
    dp.doProcess();
  },

};
