
import winston from 'winston';

import tagDao from '../dao/tagDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

// class GetTagProcessor extends BaseProcessor {
//
//   constructor(req, res, next) {
//     super(req, res, next, true);
//   }
//
//   * process() {
//     try {
//       const rows = yield tagDao.listAllTags(this.data.userid);
//       if (!rows.find(e => e[0].toLowerCase() === 'portal')) {
//         rows.push(['portal', 0]);
//       }
//       this.res.send(rows);
//       winston.loggers.get('application')
//    .debug('Get all tags from db for user %s resulted in %d rows', this.data.userid, rows.length);
//     } catch (err) {
//       winston.loggers.get('application').error(err);
//       ResponseUtil.sendErrorResponse500(err, this.res);
//     }
//     this.res.end();
//   }
//
// }

class GetTagHierarchyProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  * process() {
    try {
      const [allTags, rec] = yield Promise.all([
        tagDao.listAllTags(this.data.userid),
        tagDao.getHierarchyByUser(this.data.userid),
      ]);
      const getCountForNode = (nodeName) => {
        const matchingEle = allTags.find(e => e[0] === nodeName);
        if (matchingEle) {
          return matchingEle[1];
        }
        return 0;
      };
      let responseData;
      if (rec) {
        responseData = rec.tree.map(node => ({
          name: node.name,
          parent: node.parent,
          index: node.index,
          count: getCountForNode(node.name),
        }));
        /* { name:string, parent:string }:node */
      } else {
        if (!allTags.find(e => e[0].toLowerCase() === 'portal')) {
          allTags.push(['portal', 0]);
        }
        responseData = allTags.map((e, index) => ({
          name: e[0],
          count: e[1],
          parent: 'root',
          index,
        }));
        responseData.push({
          name: 'root',
          count: 0,
          parent: null,
          index: 0,
        });
      }
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

  // getTagCollection: function getTagCollection(req, res, next) {
  //   const glp = new GetTagProcessor(req, res, next);
  //   glp.doProcess();
  // },

  getTagHierarchy: function getTagHierarchy(req, res, next) {
    const glp = new GetTagHierarchyProcessor(req, res, next);
    glp.doProcess();
  },

  persistTagHierarchy: function persistTagHierarchy(req, res, next) {
    const pthp = new PersistTagHierarchyProcessor(req, res, next);
    pthp.doProcess();
  },

};
