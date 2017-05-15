
import _ from 'lodash';
import winston from 'winston';
import requestRaw from 'request';

import linkDao from '../dao/linkDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

const simpleWordRegex = new RegExp('^[a-z0-9]*$');
const split = tags => tags.split(' ').filter(e => simpleWordRegex.test(e));

class CreateLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    let { url } = this.req.body;
    const tags = split(this.req.body.tags);
    if (!url.startsWith('http')) {
      url = `http://${url}`;
    }
    const createdDate = new Date();
    return new Promise((resolve) => {
      const httpGetCall = requestRaw.get({
        url,
        followAllRedirects: true,
        timeout: 500,
      });
      httpGetCall.on('response', (response) => {
        httpGetCall.abort();
        let linkUrl = response.request.href;
        if (new RegExp('\\/$').test(linkUrl)) {
          linkUrl = linkUrl.substring(0, linkUrl.length - 1);
        }
        this.data = { type: 'link', callCounter: 0, createdDate, lastCalled: createdDate, linkUrl, tags };
        resolve();
      });
      httpGetCall.on('error', () => {
        httpGetCall.abort();
        this.data = { type: 'link', callCounter: 0, createdDate, lastCalled: createdDate, linkUrl: url, tags };
        resolve();
      });
    });
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
    let { url } = this.req.body;
    const { linkid } = this.req.params;
    const tags = split(this.req.body.tags);
    if (!url.startsWith('http')) {
      url = `http://${url}`;
    }
    return linkDao.getById(linkid).then((rec) => {
      this.data = Object.assign({}, rec, {
        tags,
        linkUrl: url,
      });
    });
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return ['linkUrl', 'linkid'];
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      yield linkDao.insert(this.data);
      this.res.send(this.data);
      winston.loggers.get('application').debug('Update link: %j', this.data);
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
      /* eslint-disable no-underscore-dangle */
      const responseArr = _.map(rows, row => ({
        id: row.value._id,
        linkUrl: row.value.linkUrl,
        callCounter: row.value.callCounter,
        lastCalled: row.value.lastCalled,
        createdDate: row.value.createdDate,
        tags: row.value.tags,
      }));
      /* eslint-enable no-underscore-dangle */
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
      // SECURITY: CHECK match of userid
      yield linkDao.deleteLatest(this.data.linkid);
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
