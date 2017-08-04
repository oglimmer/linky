
import winston from 'winston';
import request from 'request-promise';

import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

import { rewriteFavicon } from '../logic/Link';
import { couchdbServer } from '../dao/NanoConnection';

class SearchProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { q } = this.req.query;
    this.data = { q };
  }

  * process() {
    try {
      const query = encodeURIComponent(this.data.q);
      const url = `${couchdbServer}/_fti/local/linky/_design/lucene/by_all?include_docs=true&q=${query}%20%2Buserid%3A${this.data.userid}`;
      const searchResult = yield request.get({
        url,
        json: true,
      });
      const docs = searchResult.rows.map(r => r.doc);
      const responseArr = docs.map((row) => {
        const { _id, _rev, ...mappedRow } = row;
        mappedRow.id = _id;
        if (mappedRow.userid !== this.data.userid) {
          throw new Error('Failed to verify userid');
        }
        rewriteFavicon(mappedRow);
        return mappedRow;
      });
      this.res.send(responseArr);
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }

}

export default {

  search: (req, res, next) => {
    const glp = new SearchProcessor(req, res, next);
    glp.doProcess();
  },

};
