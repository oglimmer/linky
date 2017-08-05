import winston from 'winston';
import bluebird from 'bluebird';
import JwtUtil from '../util/JwtUtil';
import linkDao from '../dao/linkDao';
import feedUpdatesDao from '../dao/feedUpdatesDao';

/* eslint-disable no-underscore-dangle */

const leave = (req, res) => {
  if (req.cookies.authToken) {
    const { target } = req.query;
    const { authToken } = req.cookies;

    bluebird.coroutine(function* () {
      try {
        const claim = yield JwtUtil.verify(authToken);
        const loadedLinkObj = yield linkDao.getById(target);
        if (loadedLinkObj.userid !== claim.userid) {
          throw Error('Failed to verify user on referenced link');
        }
        res.redirect(loadedLinkObj.linkUrl);

        bluebird.coroutine(function* () {
          try {
            const updatedLink = loadedLinkObj;
            updatedLink.callCounter += 1;
            updatedLink.lastCalled = new Date();
            yield linkDao.insert(updatedLink);
          } catch (err) {
            winston.loggers.get('application').debug(`Failed to update link.callcounter for ${loadedLinkObj._id}`);
          }

          const feedUpdatesRec = yield feedUpdatesDao.getByLinkId(target);
          if (feedUpdatesRec) {
            if (feedUpdatesRec.latestData) {
              feedUpdatesRec.data = feedUpdatesRec.latestData;
              feedUpdatesRec.latestData = null;
              feedUpdatesRec.lastUpdated = new Date();
              try {
                yield feedUpdatesDao.insert(feedUpdatesRec);
              } catch (err) {
                winston.loggers.get('application').debug(`Failed to update feedUpdates.data for ${feedUpdatesRec._id}`);
              }
            }
          }
        })();
      } catch (err) {
        res.redirect('/');
      }
    })();
  }
};

export default (app) => {
  app.get('/leave', leave);
};
