// import winston from 'winston';
import bluebird from 'bluebird';
import JwtUtil from '../util/JwtUtil';
import linkDao from '../dao/linkDao';
import feedUpdatesDao from '../dao/feedUpdatesDao';

const leave = (req, res) => {
  if (req.cookies.authToken) {
    const { target } = req.query;
    const { authToken } = req.cookies;

    bluebird.coroutine(function* exec() {
      const claim = yield JwtUtil.verify(authToken);
      const loadedLinkObj = yield linkDao.getById(target);
      if (loadedLinkObj.userid !== claim.userid) {
        throw Error('Failed to verify user on referenced link');
      }
      res.redirect(loadedLinkObj.linkUrl);

      setTimeout(() => {
        const updatedLink = loadedLinkObj;
        updatedLink.callCounter += 1;
        updatedLink.lastCalled = new Date();
        linkDao.insert(updatedLink);
      }, 0);
      setTimeout(() => {
        bluebird.coroutine(function* updateFeedUpdates() {
          const feedUpdatesResult = yield feedUpdatesDao.getByLinkId(target);
          if (feedUpdatesResult) {
            const feedUpdatesRec = feedUpdatesResult.value;
            if (feedUpdatesRec.latestData) {
              feedUpdatesRec.data = feedUpdatesRec.latestData;
              feedUpdatesRec.latestData = null;
              feedUpdatesRec.lastUpdated = new Date();
              feedUpdatesDao.insert(feedUpdatesRec);
            }
          }
        }).bind(this)();
      }, 0);
    }).bind(this)();
  }
};

export default (app) => {
  app.get('/leave', leave);
};
