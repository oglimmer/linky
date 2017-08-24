
import winston from 'winston';
import cheerio from 'cheerio';
import BlueBirdPromise from 'bluebird';
import netscape from 'netscape-bookmarks';

import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import linkDao from '../dao/linkDao';
import tagLogic from '../logic/TagHierarchy';
import asyncWaitDao from '../dao/asyncWaitDao';
import { createRecord, updateTagHierarchy, simpleWordRegex, equalRelevant } from '../logic/Link';
import { toNetscape } from '../../src/util/Hierarchy';
import { ImportDuplicateFinder } from '../../server/util/DuplicateFinder';

const rndName = () => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 10; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const getCategories = ($a) => {
  const $node = $a.closest('DL').prev();
  const title = $node.text();
  if ($node.length > 0 && title.length > 0) {
    return [title].concat(getCategories($node));
  }
  return [];
};

class ImportProcessor extends BaseProcessor {
  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { bookmarks, tagPrefix = '', importNode } = this.req.body;
    this.data = { bookmarks, tagPrefix, importNode };
  }

  /* eslint-disable class-methods-use-this */
  propertiesToValidate() {
    return [{ name: 'importNode', default: 'root' }];
  }
  /* eslint-enable class-methods-use-this */

  validate() {
    if (!simpleWordRegex.test(this.data.tagPrefix)) {
      throw new Error(`Illegal tagPrefix ${this.data.tagPrefix}`);
    }
    if (!simpleWordRegex.test(this.data.importNode)) {
      throw new Error(`Illegal importNode ${this.data.importNode}`);
    }
  }

  async loadAsyncWaitId() {
    const asyncWaitRec = await asyncWaitDao.getAsyncWaitByByUserAndObject(this.data.userid, 'import');
    if (asyncWaitRec) {
      /* eslint-disable no-underscore-dangle */
      return {
        id: asyncWaitRec._id,
        rev: asyncWaitRec._rev,
      };
      /* eslint-enable no-underscore-dangle */
    }
    return asyncWaitDao.insert({
      type: 'asyncwait',
      userid: this.data.userid,
      object: 'import',
    });
  }

  async process() {
    const asyncWaitId = await this.loadAsyncWaitId();
    try {
      this.validate();
      const $ = cheerio.load(this.data.bookmarks);
      const allTags = new Set();
      const duplicateFinder = new ImportDuplicateFinder(allTags);
      const docs = await BlueBirdPromise.map($('a').toArray(), async (a) => {
        const $a = $(a);
        const title = $a.text();
        const url = $a.attr('href');
        winston.loggers.get('application').debug(`start to process ${url}...`);
        const categories = getCategories($a).map((c) => {
          let cat = c.replace(/[^a-zA-Z-\d]*/g, '').toLowerCase();
          if (!cat) {
            cat = rndName();
          }
          return `${this.data.tagPrefix}${cat}`;
        });
        const rec = await createRecord({
          url,
          rssUrl: null,
          tagsAsArray: categories,
          pageTitle: title,
          notes: null,
        }, this.data.userid);
        rec.tags.forEach(c => allTags.add(c));
        const updateObj = {};
        if (!equalRelevant(rec.linkUrl, url)) {
          updateObj.notes = `Original url was ${url}`;
        }
        return Object.assign({}, rec, updateObj);
      }, { concurrency: 5 });
      await duplicateFinder.onImport(docs);
      await linkDao.bulk({ docs });
      await updateTagHierarchy(this.data.userid, allTags, this.data.importNode);
      winston.loggers.get('application').debug('import done.');
      await asyncWaitDao.delete(asyncWaitId.id, asyncWaitId.rev);
      this.res.send('ok');
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
      asyncWaitDao.delete(asyncWaitId.id, asyncWaitId.rev);
    }
    this.res.end();
  }
}

class ExportProcessor extends BaseProcessor {
  constructor(req, res, next) {
    super(req, res, next, true);
  }

  async process() {
    try {
      const rows = await linkDao.listByUserid(this.data.userid);
      const tagHierarchy = await tagLogic.load(this.data.userid);
      const data = toNetscape(tagHierarchy.tree, rows.map(l => l.value));
      const html = netscape(data);
      this.res.send({ content: html });
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }
}

class ImportReadyProcessor extends BaseProcessor {
  constructor(req, res, next) {
    super(req, res, next, true);
  }

  async process() {
    try {
      const rec = await asyncWaitDao.getAsyncWaitByByUserAndObject(this.data.userid, 'import');
      const ready = !rec;
      this.res.send({ importDone: ready });
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }
}

export default {

  import: (req, res, next) => {
    const glp = new ImportProcessor(req, res, next);
    glp.doProcess();
  },

  export: (req, res, next) => {
    const glp = new ExportProcessor(req, res, next);
    glp.doProcess();
  },

  importReady: (req, res, next) => {
    const glp = new ImportReadyProcessor(req, res, next);
    glp.doProcess();
  },

};
