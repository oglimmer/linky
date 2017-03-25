
import _ from 'lodash';
import winston from 'winston';
import linkDao from '../dao/linkDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';


class CreateLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { linkUrl } = this.req.body;
    this.data = { type: 'link', linkUrl };
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return ['linkUrl'];
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      const { id } = yield linkDao.insert(this.data);
      this.res.send({ id });
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
      const responseArr = _.map(rows, row => ({ id: row.value._id, linkUrl: row.value.linkUrl }));
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
