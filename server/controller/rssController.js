
import winston from 'winston';
import { parseString } from 'xml2js';
import request from 'request-promise';
import { Promise } from 'bluebird';

import linkDao from '../dao/linkDao';
import feedUpdatesDao from '../dao/feedUpdatesDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

const parseStringPromise = Promise.promisify(parseString);

class GetRssUpdatesProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { linkId } = this.req.params;
    this.data = { linkId };
  }

  /* eslint-disable class-methods-use-this */
  getKeyContent(content) {
    const currentFeedData = [];
    if (!content) {
      return 'No content found';
    } else if (content['rdf:RDF']) {
      if (!content['rdf:RDF'].item) {
        return 'No item in RSS found';
      }
      content['rdf:RDF'].item.forEach((e) => {
        // console.log(e);
        if (e.title) {
          currentFeedData.push(e.title[0]);
        } else {
          console.log('entry without title :/');
        }
      });
    } else if (content.rss) {
      if (!content.rss.channel) {
        return 'No channel in RSS found';
      }
      content.rss.channel.forEach((e) => {
        if (e.item) {
          e.item.forEach((f) => {
            // console.log(f);
            if (f.guid) {
              if (typeof f.guid[0] === 'string') {
                currentFeedData.push(f.guid[0]);
              } else {
                currentFeedData.push(f.guid[0]._);
              }
            } else if (f.title) {
              currentFeedData.push(f.title[0]);
            } else {
              console.log('entry without guid or title :/');
            }
          });
        }
      });
    } else if (content.feed) {
      const xmlns = content.feed.$;
      console.log(`xmlns = ${xmlns}`);
      if (!content.feed.entry) {
        console.log(content);
        return 'No entry in RSS found';
      }
      content.feed.entry.forEach((e) => {
        if (e.id) {
          currentFeedData.push(e.id[0]);
        } else if (e.title) {
          currentFeedData.push(e.title[0]);
        } else {
          console.log('entry without id or title :/');
        }
      });
    } else {
      console.log(content);
      return 'No valid RSS found';
    }
    // console.log('currentFeedData');
    // console.log(currentFeedData);
    return currentFeedData;
  }
  /* eslint-enable class-methods-use-this */

  * process() {
    try {
      const rec = yield linkDao.getById(this.data.linkId);
      if (!rec || !rec.rssUrl) {
        this.res.send('ERROR. No rssUrl for this link.');
      } else {
        const contentXmlStr = yield request.get({ uri: rec.rssUrl });
        const content = yield parseStringPromise(contentXmlStr);
        const currentFeedData = this.getKeyContent(content);
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
          } else {
            feedUpdatesRec = feedUpdatesRec.value;
          }
          // console.log('feedUpdatesRec');
          // console.log(feedUpdatesRec);
          const newFeedData = currentFeedData.filter(e => feedUpdatesRec.data.indexOf(e) === -1);
          // console.log('newFeedData');
          // console.log(newFeedData);
          if (newFeedData.length > 0) {
            feedUpdatesRec.latestData = currentFeedData;
            feedUpdatesRec.lastUpdated = new Date();
            feedUpdatesDao.insert(feedUpdatesRec);
          }
          this.res.send({ result: newFeedData.length });
          winston.loggers.get('application').debug('RssUpdates for %s = %i', rec.rssUrl, newFeedData.length);
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
    const glp = new GetRssUpdatesProcessor(req, res, next);
    glp.doProcess();
  },


};
