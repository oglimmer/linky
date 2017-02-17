
import assert from 'assert';
import _ from 'lodash';
import nano from 'nano';

const linkyDb = nano('http://localhost:5984/linky');

/* eslint-disable no-underscore-dangle */
class BaseDataAccessObject {

  /* eslint-disable class-methods-use-this */
  getDb() {
    return linkyDb;
  }

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
  /* eslint-enable class-methods-use-this */

  insert(obj) {
    return new Promise((fulfill, reject) => {
      this.getDb().insert(obj, (err, body) => {
        if (_.isObject(err)) {
          reject(err);
        } else {
          fulfill(body);
        }
      });
    });
  }


  listByView(ddoc, viewName, key) {
    return new Promise((fulfill, reject) => {
      this.getDb().view(ddoc, viewName, { keys: [key] }, (err, body) => {
        if (_.isObject(err)) {
          reject(err);
        } else {
          fulfill(body.rows);
        }
      });
    });
  }

  getById(id) {
    return new Promise((fulfill, reject) => {
      this.getDb().get(id, (err, body) => {
        if (_.isObject(err)) {
          reject(err);
        } else {
          fulfill(body);
        }
      });
    });
  }

  delete(id, rev) {
    return new Promise((fulfill, reject) => {
      this.getDb().destroy(id, rev, (err, body) => {
        if (_.isObject(err)) {
          reject(err);
        } else {
          fulfill(body);
        }
      });
    });
  }

  deleteLatest(id) {
    return this.getById(id).then(obj => this.delete(id, obj._rev));
  }

}
/* eslint-disable no-underscore-dangle */

export default BaseDataAccessObject;
