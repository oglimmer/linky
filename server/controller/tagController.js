
import winston from 'winston';

import tagDao from '../dao/tagDao';
import linkDao from '../dao/linkDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import TagHierarchyLogic from '../logic/TagHierarchy';
import { READONLY_TAGS } from '../../src/util/TagRegistry';

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
    this.data = { tree };
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return [{ name: 'tree' }];
  }
  /* eslint-enable class-methods-use-this */

  validateData() {
    const usedNames = {};
    const usedIndexs = {};
    this.data.tree.forEach((treeElement) => {
      if (usedNames[treeElement.name]) {
        throw new Error(`Failed to persist due to duplicate name=${treeElement.name}`);
      }
      if (treeElement.name === 'root' && treeElement.parent === null) {
        return;
      }
      if (treeElement.parent === null) {
        throw new Error(`Failed to persist due to null === parent=${treeElement.name}`);
      }
      let usedIndexForParent = usedIndexs[treeElement.parent];
      if (!usedIndexForParent) {
        usedIndexForParent = {};
        usedIndexs[treeElement.parent] = usedIndexForParent;
      }
      const index = `INDEX${treeElement.index}`;
      if (usedIndexForParent[index]) {
        throw new Error(`Failed to persist due to duplicate index=${treeElement.index},name=${treeElement.name},parent=${treeElement.parent}`);
      }
      usedNames[treeElement.name] = true;
      usedIndexForParent[index] = true;
      if (this.data.tree.findIndex(e => e.name === treeElement.parent) === -1) {
        throw new Error(`Failed to persist due to missing parent=${treeElement.parent}`);
      }
    });
  }

  * process() {
    try {
      this.validateData();
      const rec = yield tagDao.getHierarchyByUser(this.data.userid);
      let recToWrite;
      if (!rec) {
        recToWrite = TagHierarchyLogic.createTagHierarchy(
          this.data.userid,
          this.data.tree.map(e => ({ name: e.name, parent: e.parent, index: e.index })),
        );
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

class RemoveTagProcessor extends BaseProcessor {
  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { name } = this.req.params;
    this.data = { name };
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return [{ name: 'name' }];
  }
  /* eslint-enable class-methods-use-this */

  validateData(tagHierarchyRec) {
    if (READONLY_TAGS.findIndex(e => e === this.data.name) !== -1) {
      throw new Error(`Cannot delete ${this.data.name} because this is a system tag.`);
    }
    if (tagHierarchyRec &&
      tagHierarchyRec.tree.findIndex(e => e.parent === this.data.name) !== -1) {
      throw new Error(`Cannot delete ${this.data.name} because it has child tags.`);
    }
  }

  * process() {
    try {
      const tagHierarchyRec = yield tagDao.getHierarchyByUser(this.data.userid);
      this.validateData(tagHierarchyRec);
      if (tagHierarchyRec) {
        const recToWrite = Object.assign({}, tagHierarchyRec, {
          tree: tagHierarchyRec.tree.filter(e => e.name !== this.data.name),
        });
        tagDao.insert(recToWrite);
      }
      const rows = yield linkDao.listByUseridAndTag(this.data.userid, this.data.name);
      const docsToWrite = rows.map((row) => {
        const recLink = row.value;
        recLink.tags = recLink.tags.filter(e => e !== this.data.name);
        return recLink;
      });
      linkDao.bulk({ docs: docsToWrite });
      this.res.send({ result: 'ok' });
      winston.loggers.get('application').debug('Tag removed name=%s', this.data.name);
    } catch (err) {
      winston.loggers.get('application').error('Failed to remove Tag from TagHierarchy and LinkList. Error = %j', err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }
}

export default {

  getTagHierarchy: (req, res, next) => {
    const glp = new GetTagHierarchyProcessor(req, res, next);
    glp.doProcess();
  },

  persistTagHierarchy: (req, res, next) => {
    const pthp = new PersistTagHierarchyProcessor(req, res, next);
    pthp.doProcess();
  },

  removeTag: (req, res, next) => {
    const pthp = new RemoveTagProcessor(req, res, next);
    pthp.doProcess();
  },

};
