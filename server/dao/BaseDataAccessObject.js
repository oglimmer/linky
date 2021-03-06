
import assert from 'assert';
import { Promise } from 'bluebird';
import winston from 'winston';

import linkyDb from './NanoConnection';

class BaseDataAccessObject {
  constructor(db = linkyDb) {
    this.dbrefs = {
      insert: Promise.promisify(db.insert),
      view: Promise.promisify(db.view),
      get: Promise.promisify(db.get),
      destroy: Promise.promisify(db.destroy),
      bulk: Promise.promisify(db.bulk),
      fetch: Promise.promisify(db.fetch),
      attachment: db.attachment,
    };
  }

  /* eslint-disable class-methods-use-this */
  getFirstElement(rows) {
    return new Promise((fulfill) => {
      assert(rows.length < 2);
      if (rows.length === 0) {
        fulfill(null);
      } else {
        fulfill(rows[0].value);
      }
    });
  }

  getFirstElementRaw(rows) {
    return new Promise((fulfill) => {
      assert(rows.length < 2);
      if (rows.length === 0) {
        fulfill(null);
      } else {
        fulfill(rows[0]);
      }
    });
  }
  /* eslint-enable class-methods-use-this */

  insert(obj) {
    return this.dbrefs.insert(obj);
  }

  bulk(obj) {
    return this.dbrefs.bulk(obj);
  }

  fetch(obj) {
    return this.dbrefs.fetch(obj);
  }

  async listByViewMultiParams(ddoc, viewName, start, end, params) {
    const allParams = Object.assign({
      startkey: start,
      endkey: end,
    }, params);
    const body = await this.dbrefs.view(ddoc, viewName, allParams);
    return body.rows;
  }

  async listByView(ddoc, viewName, key) {
    const allParams = { };
    if (key) {
      allParams.keys = [key];
    }
    const body = await this.dbrefs.view(ddoc, viewName, allParams);
    return body.rows;
  }

  getById(id) {
    return this.dbrefs.get(id);
  }

  delete(id, rev) {
    return this.dbrefs.destroy(id, rev);
  }

  async deleteLatest(id, userid) {
    const obj = await this.getById(id);
    if (userid !== obj.userid) {
      winston.loggers.get('application').debug(`DB entry has user=${obj.userid} but change was initiated by=${userid}`);
      throw Error('Wrong user!');
    }
    /* eslint-disable no-underscore-dangle */
    this.delete(id, obj._rev);
    /* eslint-disable no-underscore-dangle */
  }
}

export default BaseDataAccessObject;
