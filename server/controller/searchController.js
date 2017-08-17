
import winston from 'winston';
import request from 'request-promise';

import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

import { couchdbServer } from '../dao/NanoConnection';

// don't escape * and " - the user wants to use them in their special character's meaning
// those should be escaped as well: '&&', '||', but I am too lazy to implement it right now
const LUCENE_SPECIAL_CHARS = ['+', '-', '!', '(', ')', '{', '}', '[', ']', '^', '~', '?', ':', '\\', '/'];

const escapeLuceneChars = (str) => {
  const buffer = [];
  for (let i = 0, len = str.length; i < len; i += 1) {
    const char = str[i];
    LUCENE_SPECIAL_CHARS.forEach((c) => {
      if (c === char) {
        buffer.push('\\');
      }
    });
    buffer.push(char);
  }
  return buffer.join('');
};

const fields = ['tags', 'title', 'rss', 'notes', 'url'];

const purifyUrl = (userInput) => {
  let userUrl = userInput.substr(4);
  if (userUrl.startsWith('*')) {
    userUrl = userUrl.substr(1);
  }
  if (userUrl.startsWith('http://')) {
    userUrl = userUrl.substr(7);
  } else if (userUrl.startsWith('https://')) {
    userUrl = userUrl.substr(8);
  }
  if (userUrl.startsWith('www.')) {
    userUrl = userUrl.substr(4);
  }
  if (!userUrl.startsWith('*')) {
    userUrl = `*${userUrl}`;
  }
  if (!userUrl.endsWith('*')) {
    userUrl = `${userUrl}*`;
  }
  return userUrl;
};

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
      const userInput = this.data.q;
      let luceneQuery = '';
      fields.forEach((f) => {
        if (userInput.startsWith(`${f}:`)) {
          const modUserInput = f === 'url' ? purifyUrl(userInput) : userInput.substr(f.length + 1);
          luceneQuery = `+${f}:${escapeLuceneChars(modUserInput)}`;
        }
      });
      if (!luceneQuery) {
        luceneQuery = `+${escapeLuceneChars(userInput)}`;
      }
      const query = encodeURIComponent(luceneQuery);
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
