
import winston from 'winston';

import linkDao from '../dao/linkDao';
import tagDao from '../dao/tagDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import { fixUrl, validateAndEnhanceTags, getTags,
  createRecord, presistRecord, updateTagHierarchy } from '../logic/Link';
import { findDuplicatesSingleAddEditLink } from '../util/DuplicateFinder';

import { READONLY_TAGS } from '../../src/util/TagRegistry';

class CreateLinkProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { url, rssUrl, tags, pageTitle, notes } = this.req.body;
    this.data = { url, rssUrl, tagsAsString: tags, pageTitle, notes };
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return [{ name: 'url' }];
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      const newLinkRec = yield createRecord(this.data, this.data.userid);
      const collateral = yield findDuplicatesSingleAddEditLink(this.data.userid, newLinkRec);
      const { id } = yield presistRecord(newLinkRec);
      newLinkRec.id = id;
      this.res.send({ primary: newLinkRec, collateral });
      updateTagHierarchy(this.data.userid, newLinkRec.tags);
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
    const tags = validateAndEnhanceTags(getTags(this.req.body.tags), rssUrl);
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
    return [{ name: 'linkUrl' }, { name: 'linkid' }];
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
      const collateral = yield findDuplicatesSingleAddEditLink(this.data.userid, recToWrite);
      yield linkDao.insert(recToWrite);
      /* eslint-disable no-underscore-dangle */
      recToWrite.id = recToWrite._id;
      /* eslint-enable no-underscore-dangle */
      this.res.send({ primary: recToWrite, collateral });
      updateTagHierarchy(this.data.userid, this.data.tags);
      winston.loggers.get('application').debug('Update link: %j', recToWrite);
    } catch (err) {
      winston.loggers.get('application').error('Failed to create link. Error = %j', err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

// changes tag A to tag B on tagHierarchy and linkList
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
    return [{ name: 'oldTagName' }, { name: 'newTagName' }];
  }
  /* eslint-enable class-methods-use-this */

  validate() {
    if (READONLY_TAGS.findIndex(e => e === this.data.oldTagName) !== -1) {
      throw new Error(`Change to ${this.data.oldTagName} not possible`);
    }
  }

  * process() {
    try {
      this.validate();
      // update links
      const rawRows = yield linkDao.listByUseridAndTag(this.data.userid, this.data.oldTagName);
      const docs = rawRows.map((row) => {
        const rec = row.value;
        rec.tags.splice(rec.tags.findIndex(e => e === this.data.oldTagName), 1);
        if (rec.tags.findIndex(tag => tag === this.data.newTagName) === -1) {
          rec.tags.push(this.data.newTagName);
        }
        return rec;
      });
      yield linkDao.bulk({ docs });
      // update tag hierarchy
      const tagHierarchyRec = yield tagDao.getHierarchyByUser(this.data.userid);
      const tagHierarchy = tagHierarchyRec.tree;
      const indexTarget = tagHierarchy.findIndex(e => e.name === this.data.newTagName);
      const indexOld = tagHierarchy.findIndex(e => e.name === this.data.oldTagName);
      if (indexTarget === -1) {
        // rename
        tagHierarchy[indexOld].name = this.data.newTagName;
      } else {
        // merge
        tagHierarchy.splice(indexOld, 1);
      }
      tagHierarchy.forEach((ele) => {
        const elementToUpdate = ele;
        if (ele.parent === this.data.oldTagName) {
          elementToUpdate.parent = this.data.newTagName;
        }
      });
      tagDao.insert(tagHierarchyRec);
      // get count for new target tag
      const newRows = yield linkDao.listByUseridAndTag(this.data.userid, this.data.newTagName);
      this.res.send({ count: newRows.length });
      winston.loggers.get('application').debug('Updated %i links from %s to %s', docs.length, this.data.oldTagName, this.data.newTagName);
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
    return [{ name: 'linkid' }];
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
