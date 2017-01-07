'use strict';

const assert = require('assert');
const _ = require('lodash');
const linkyDb = require('nano')('http://localhost:5984/linky');

class BaseDataAccessObject {

	getDb() {
		return linkyDb;
	}

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

	getFirstElement(rows) {
		return new Promise((fulfill, reject) => {
			assert(rows.length < 2);
			if(rows.length === 0 ) {
				fulfill(null);
			} else {
				fulfill(rows[0]);
			}
		});
	}

	listByView(ddoc, viewName, key) {
		return new Promise((fulfill, reject) => {
			this.getDb().view(ddoc, viewName, { keys: [ key ] }, (err, body) => {
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

module.exports = BaseDataAccessObject;
