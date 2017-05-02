
import _ from 'lodash';
import winston from 'winston';
import request from 'request-promise';

import linkDao from '../dao/linkDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';


class CreateLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    let { url } = this.req.body;
    if (!url.startsWith('http')) {
      url = `http://${url}`;
    }
    return request.get({ url, resolveWithFullResponse: true, followAllRedirects: true })
      .then((response) => {
        const createdDate = new Date();
        let linkUrl = response.request.href;
        if (new RegExp('\\/$').test(linkUrl)) {
          linkUrl = linkUrl.substring(0, linkUrl.length - 1);
        }
        this.data = { type: 'link', callCounter: 0, createdDate, lastCalled: createdDate, linkUrl };
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
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

class GetLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  * process() {
    try {
      const rows = yield linkDao.listByUserid(this.data.userid);
      /* eslint-disable no-underscore-dangle */
      const responseArr = _.map(rows, row => ({
        id: row.value._id,
        linkUrl: row.value.linkUrl,
        callCounter: row.value.callCounter,
        lastCalled: row.value.lastCalled,
        createdDate: row.value.createdDate,
      }));
      /* eslint-enable no-underscore-dangle */
      this.res.send(responseArr);
      winston.loggers.get('application').debug('Get all links from db for user %s resulted in %d rows', this.data.userid, responseArr.length);
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

  getLinkCollection: function getLinkCollection(req, res, next) {
    const glp = new GetLinkProcessor(req, res, next);
    glp.doProcess();
  },

  deleteLink: function deleteLink(req, res, next) {
    const dp = new DeleteProcessor(req, res, next);
    dp.doProcess();
  },

};
