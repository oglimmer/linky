
import assert from 'assert';
import nano from 'nano';
import { Promise } from 'bluebird';

const linkyDb = nano('http://localhost:5984/linky');
const insert = Promise.promisify(linkyDb.insert);
const view = Promise.promisify(linkyDb.view);
const get = Promise.promisify(linkyDb.get);
const destroy = Promise.promisify(linkyDb.destroy);

class BaseDataAccessObject {

  /* eslint-disable class-methods-use-this */
  getFirstElement(rows) {
    return new Promise((fulfill) => {
      assert(rows.length < 2);
      if (rows.length === 0) {
        fulfill(null);
      } else {
        fulfill(rows[0]);
      }
    });
  }

  insert(obj) {
    return insert(obj);
  }

  listByViewMultiParams(ddoc, viewName, start, end, params) {
    const allParams = Object.assign({}, params);
    allParams.startkey = start;
    allParams.endkey = end;
    return view(ddoc, viewName, allParams).then(body => body.rows);
  }

  listByView(ddoc, viewName, key) {
    return view(ddoc, viewName, { keys: [key] }).then(body => body.rows);
  }

  getById(id) {
    return get(id);
  }

  delete(id, rev) {
    return destroy(id, rev);
  }

  deleteLatest(id) {
    /* eslint-disable no-underscore-dangle */
    return this.getById(id).then(obj => this.delete(id, obj._rev));
    /* eslint-disable no-underscore-dangle */
  }
  /* eslint-enable class-methods-use-this */

}

export default BaseDataAccessObject;
