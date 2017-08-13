
import winston from 'winston';
import { parseString } from 'xml2js';
import request from 'request-promise';
import { Promise } from 'bluebird';
import iconv from 'iconv-lite';

import linkDao from '../dao/linkDao';
import feedUpdatesDao from '../dao/feedUpdatesDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

const parseStringPromise = Promise.promisify(parseString);

// SUPPORTED FEED TYPES:
// https://en.wikipedia.org/wiki/Atom_(standard)
// https://en.wikipedia.org/wiki/RSS
// http://web.resource.org/rss/1.0/spec

const getIdForAtom = (e) => {
  if (e.id) {
    return e.id[0];
  } else if (e.title) {
    return e.title[0];
  }
  console.log('entry without id or title :/');
  return 'no id found';
};

const getIdForRss2 = (e) => {
  if (e.guid) {
    if (typeof e.guid[0] === 'string') {
      return e.guid[0];
    }
    return e.guid[0]._;
  } else if (e.title) {
    return e.title[0];
  }
  console.log('entry without guid or title :/');
  return 'no id found';
};

const getIdForRdf = (e) => {
  if (e.title) {
    return e.title[0];
  }
  console.log('entry without title :/');
  return 'no id found';
};

const createDisplayElement = (e) => {
  const ele = {};
  if (e.link) {
    ele.link = '';
    e.link.forEach((link) => {
      if (typeof link === 'string') {
        ele.link += link;
      } else {
        ele.link += link.$.href;
      }
    });
  } else {
    ele.link = 'no link';
  }
  if (e.title) {
    if (typeof e.title[0] === 'string') {
      ele.title = e.title[0];
    } else {
      ele.title = e.title[0]._;
    }
  } else {
    ele.title = ele.link;
  }
  if (ele.title.length > 150) {
    ele.title = `${ele.title.substring(0, 150)}...`;
  }
  return ele;
};

const getKeyContent = (content) => {
  const currentFeedData = [];
  if (!content) {
    return 'No content found';
  } else if (content['rdf:RDF']) {
    if (!content['rdf:RDF'].item) {
      return 'No item in RSS found';
    }
    content['rdf:RDF'].item.forEach((e) => {
      currentFeedData.push(getIdForRdf(e));
    });
  } else if (content.rss) {
    if (!content.rss.channel) {
      return 'No channel in RSS found';
    }
    content.rss.channel.forEach((e) => {
      if (e.item) {
        e.item.forEach((f) => {
          currentFeedData.push(getIdForRss2(f));
        });
      }
    });
  } else if (content.feed) {
    // const xmlns = content.feed.$;
    // console.log(`xmlns = ${xmlns}`);
    if (!content.feed.entry) {
      winston.loggers.get('application').debug('No entries for %j', content);
      return 'No entry in RSS found';
    }
    content.feed.entry.forEach((e) => {
      currentFeedData.push(getIdForAtom(e));
    });
  } else {
    winston.loggers.get('application').debug('No valid RSS: %j', content);
    return 'No valid RSS found';
  }
  return currentFeedData;
};

const getDisplayContent = (content, newIds) => {
  const currentFeedData = [];
  if (!content) {
    return 'No content found';
  } else if (content['rdf:RDF']) {
    if (!content['rdf:RDF'].item) {
      return 'No item in RSS found';
    }
    content['rdf:RDF'].item.filter(e => newIds.find(id => id === getIdForRdf(e))).forEach((e) => {
      currentFeedData.push(createDisplayElement(e));
    });
  } else if (content.rss) {
    if (!content.rss.channel) {
      return 'No channel in RSS found';
    }
    content.rss.channel.forEach((chan) => {
      if (chan.item) {
        chan.item.filter(e => newIds.find(id => id === getIdForRss2(e))).forEach((e) => {
          currentFeedData.push(createDisplayElement(e));
        });
      }
    });
  } else if (content.feed) {
    if (!content.feed.entry) {
      winston.loggers.get('application').debug('No entries for %j', content);
      return 'No entry in RSS found';
    }
    content.feed.entry.filter(e => newIds.find(id => id === getIdForAtom(e))).forEach((e) => {
      currentFeedData.push(createDisplayElement(e));
    });
  } else {
    winston.loggers.get('application').debug('No valid RSS: %j', content);
    return 'No valid RSS found';
  }
  return currentFeedData;
};


class GetRssUpdatesProcessor extends BaseProcessor {

  constructor(req, res, next, includingDisplay) {
    super(req, res, next, true);
    this.includingDisplay = includingDisplay;
  }

  collectBodyParameters() {
    const { linkId } = this.req.params;
    this.data = { linkId };
  }

  static getContent(response) {
    let encoding = null;
    const contentType = response.headers['content-type'];
    if (contentType) {
      const pos = contentType.indexOf('charset=');
      if (pos > -1) {
        encoding = contentType.substr(pos + 8);
      }
    }
    return encoding ? iconv.decode(response.body, encoding) : response.body.toString();
  }

  * process() {
    try {
      const rec = yield linkDao.getById(this.data.linkId);
      if (!rec || !rec.rssUrl) {
        this.res.send('ERROR. No rssUrl for this link.');
      } else {
        const response = yield request.get({
          uri: rec.rssUrl,
          encoding: null,
          resolveWithFullResponse: true,
        });
        const content = yield parseStringPromise(GetRssUpdatesProcessor.getContent(response));
        const currentFeedData = getKeyContent(content);
        if (typeof currentFeedData === 'string') {
          ResponseUtil.sendErrorResponse500(currentFeedData, this.res);
        } else {
          let feedUpdatesRec = yield feedUpdatesDao.getByLinkId(this.data.linkId);
          if (!feedUpdatesRec) {
            feedUpdatesRec = {
              type: 'feedUpdates',
              linkId: this.data.linkId,
              userid: this.data.userid,
              data: [],
              createdDate: new Date(),
              lastUpdated: new Date(),
            };
          }
          const newFeedData = currentFeedData.filter(e => feedUpdatesRec.data.indexOf(e) === -1);
          winston.loggers.get('application').debug('RssUpdates for %s = %j', rec.rssUrl, newFeedData);
          if (newFeedData.length > 0) {
            feedUpdatesRec.latestData = currentFeedData;
            feedUpdatesRec.lastUpdated = new Date();
            feedUpdatesDao.insert(feedUpdatesRec);
          }
          const response = { result: newFeedData.length };
          if (this.includingDisplay) {
            response.display = getDisplayContent(content, newFeedData);
          }
          this.res.send(response);
          winston.loggers.get('application').debug('RssUpdates for %s = %d', rec.rssUrl, newFeedData.length);
        }
      }
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }
}

export default {

  getRssUpdatesCollection: function getRssUpdatesCollection(req, res, next) {
    const glp = new GetRssUpdatesProcessor(req, res, next, false);
    glp.doProcess();
  },

  getRssUpdatesDetails: function getRssUpdatesDetails(req, res, next) {
    const glp = new GetRssUpdatesProcessor(req, res, next, true);
    glp.doProcess();
  },

};
