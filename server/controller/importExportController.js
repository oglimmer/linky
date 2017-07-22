
import winston from 'winston';

import cheerio from 'cheerio';

import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import linkDao from '../dao/linkDao';
import { createRecord, updateTagHierarchy } from '../logic/Link';

const rndName = () => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 10; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const equalIgnoringLastSlash = (strA, strB) => {
  if (!strA && !strB) {
    return true;
  }
  if ((!strA && !!strB) || (!!strA && !strB)) {
    return false;
  }
  if (strA === strB) {
    return true;
  }
  if (strA.endsWith('/')) {
    return strA.substr(0, strA.length - 1) === strB;
  }
  if (strB.endsWith('/')) {
    return strB.substr(0, strB.length - 1) === strA;
  }
  return false;
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

  /* eslint-disable require-yield */
  * process() {
    try {
      const $ = cheerio.load(this.data.bookmarks);
      const allTags = new Set();
      const docsPromises = [];
      $('a').each((index, a) => {
        const $a = $(a);
        const title = $a.text();
        const url = $a.attr('href');
        const categories = getCategories($a).map((c) => {
          let cat = c.replace(/[^a-zA-Z\d]*/g, '').toLowerCase();
          if (!cat) {
            cat = rndName();
          }
          return `${this.data.tagPrefix}${cat}`;
        });
        docsPromises.push(createRecord({
          url,
          rssUrl: null,
          tagsAsArray: categories,
          pageTitle: title,
          notes: null,
        })
        .then((rec) => {
          rec.tags.forEach(c => allTags.add(c));
          const updateObj = { userid: this.data.userid };
          if (!equalIgnoringLastSlash(rec.linkUrl, url)) {
            updateObj.notes = `Original url was ${url}`;
          }
          return Object.assign({}, rec, updateObj);
        }));
      });
      Promise.all(docsPromises)
        .then(docs => linkDao.bulk({ docs }))
        .then(() => updateTagHierarchy(this.data.userid, allTags, this.data.importNode));
      this.res.send('ok');
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }
  /* eslint-enable require-yield */

}

export default {

  import: (req, res, next) => {
    const glp = new ImportProcessor(req, res, next);
    glp.doProcess();
  },


};
