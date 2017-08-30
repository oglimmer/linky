import winston from 'winston';

import JwtUtil from '../util/JwtUtil';
import linkDao from '../dao/linkDao';
import feedUpdatesDao from '../dao/feedUpdatesDao';
import { hashSha256Hex } from '../util/HashUtil';
import { getArchiveDomain } from '../Logic/Archive';


/* eslint-disable no-underscore-dangle */

class SimpleLeaveProcessor {
  static async leave(req, res) {
    if (req.cookies.authToken) {
      const { target } = req.query;
      const { authToken } = req.cookies;
      try {
        const claim = await JwtUtil.verify(authToken);
        const loadedLinkObj = await linkDao.getById(target);
        if (loadedLinkObj.userid !== claim.userid) {
          throw Error('Failed to verify user on referenced link');
        }
        let targetUrl = loadedLinkObj.linkUrl;
        if (targetUrl.startsWith(`${getArchiveDomain()}/archive/`)) {
          const tempClaim = { archiveUserHash: hashSha256Hex(loadedLinkObj.userid) };
          const tempAuthToken = await JwtUtil.sign(tempClaim, '1h');
          targetUrl += `?tmpAuthToken=${tempAuthToken}`;
        }
        res.redirect(targetUrl);
        try {
          const updatedLink = loadedLinkObj;
          updatedLink.callCounter += 1;
          updatedLink.lastCalled = new Date();
          await linkDao.insert(updatedLink);
        } catch (err) {
          winston.loggers.get('application').debug(`Failed to update link.callcounter for ${loadedLinkObj._id}`);
        }

        const feedUpdatesRec = await feedUpdatesDao.getByLinkId(target);
        if (feedUpdatesRec) {
          if (feedUpdatesRec.latestData) {
            feedUpdatesRec.data = feedUpdatesRec.latestData;
            feedUpdatesRec.latestData = null;
            feedUpdatesRec.lastUpdated = new Date();
            try {
              await feedUpdatesDao.insert(feedUpdatesRec);
            } catch (err) {
              winston.loggers.get('application').debug(`Failed to update feedUpdates.data for ${feedUpdatesRec._id}`);
            }
          }
        }
      } catch (err) {
        res.redirect('/');
      }
    }
  }
}

export default {

  leave: (req, res) => {
    SimpleLeaveProcessor.leave(req, res);
  },


};
