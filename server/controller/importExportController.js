
import winston from 'winston';
import cheerio from 'cheerio';
import BlueBirdPromise from 'bluebird';
import netscape from 'netscape-bookmarks';

import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import linkDao from '../dao/linkDao';
import { createRecord, updateTagHierarchy, simpleWordRegex } from '../logic/Link';

const rndName = () => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 10; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const equalRelevant = (strA, strB) => {
  const noTrailingSlash = str => (str.endsWith('/') ? str.substr(0, str.length - 1) : str);
  const noHttpProtocol = str => (str.startsWith('http://') ? str.substr('http://'.length) : str);
  const noHttpsProtocol = str => (str.startsWith('https://') ? str.substr('https://'.length) : str);
  const noProtocol = str => noHttpsProtocol(noHttpProtocol(str));
  if (!strA && !strB) {
    return true;
  }
  if ((!strA && !!strB) || (!!strA && !strB)) {
    return false;
  }
  if (strA === strB) {
    return true;
  }
  return noProtocol(noTrailingSlash(strA)) === noProtocol(noTrailingSlash(strB));
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

  /* eslint-disable require-yield */
  * process() {
    try {
      this.validate();
      const $ = cheerio.load(this.data.bookmarks);
      const allTags = new Set();
      BlueBirdPromise.map($('a').toArray(), (a) => {
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
        return createRecord({
          url,
          rssUrl: null,
          tagsAsArray: categories,
          pageTitle: title,
          notes: null,
        })
        .then((rec) => {
          rec.tags.forEach(c => allTags.add(c));
          const updateObj = { userid: this.data.userid };
          if (!equalRelevant(rec.linkUrl, url)) {
            updateObj.notes = `Original url was ${url}`;
          }
          return Object.assign({}, rec, updateObj);
        });
      }, { concurrency: 5 })
        .then(docs => linkDao.bulk({ docs }))
        .then(() => updateTagHierarchy(this.data.userid, allTags, this.data.importNode))
        .then(() => winston.loggers.get('application').debug('import done.'));
      this.res.send('ok');
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }
  /* eslint-enable require-yield */

}

class ExportProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    this.data = {};
  }

  * process() {
    try {
      const rows = yield linkDao.listByUserid(this.data.userid);
      console.log(JSON.stringify(rows));
      const data = {};
      rows.forEach((row) => {
        const rec = row.value;
        data[rec.pageTitle] = rec.linkUrl;
      });
      const html = netscape(data);
      this.res.send({ content: html });
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

};
