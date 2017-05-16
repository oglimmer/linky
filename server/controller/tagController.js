
import winston from 'winston';

import tagDao from '../dao/tagDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

class GetTagProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  * process() {
    try {
      const rows = yield tagDao.listAllTags(this.data.userid);
      if (!rows.find(e => e[0].toLowerCase() === 'portal')) {
        rows.push(['portal', 0]);
      }
      this.res.send(rows);
      winston.loggers.get('application').debug('Get all tags from db for user %s resulted in %d rows', this.data.userid, rows.length);
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

export default {

  getTagCollection: function getTagCollection(req, res, next) {
    const glp = new GetTagProcessor(req, res, next);
    glp.doProcess();
  },


};
