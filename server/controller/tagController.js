
import winston from 'winston';

import tagDao from '../dao/tagDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import TagHierarchyLogic from '../logic/TagHierarchy';

class GetTagHierarchyProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  * process() {
    try {
      const responseData = yield TagHierarchyLogic.loadResponseData(this.data.userid);
      this.res.send(responseData);
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

class PersistTagHierarchyProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { tree } = this.req.body;
    console.log(JSON.stringify(tree));
    this.data = {
      tree,
    };
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return ['tree'];
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      const rec = yield tagDao.getHierarchyByUser(this.data.userid);
      let recToWrite;
      if (!rec) {
        recToWrite = {
          tree: this.data.tree.map(e => ({ name: e.name, parent: e.parent, index: e.index })),
          userid: this.data.userid,
          type: 'hierarchy',
        };
      } else {
        recToWrite = Object.assign({}, rec, {
          tree: this.data.tree.map(e => ({ name: e.name, parent: e.parent, index: e.index })),
        });
      }
      const { id } = yield tagDao.insert(recToWrite);
      this.res.send({ result: 'ok' });
      winston.loggers.get('application').debug('Persisted TagHierarchy id=%s to db: %j', id, this.data);
    } catch (err) {
      winston.loggers.get('application').error('Failed to persist TagHierarchy. Error = %j', err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

export default {

  getTagHierarchy: function getTagHierarchy(req, res, next) {
    const glp = new GetTagHierarchyProcessor(req, res, next);
    glp.doProcess();
  },

  persistTagHierarchy: function persistTagHierarchy(req, res, next) {
    const pthp = new PersistTagHierarchyProcessor(req, res, next);
    pthp.doProcess();
  },

};
