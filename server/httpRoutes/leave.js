import winston from 'winston';
import JwtUtil from '../util/JwtUtil';
import linkDao from '../dao/linkDao';

const updateLinkAndForward = (loadedLinkObj, claim, res) => {
  if (loadedLinkObj.userid !== claim.userid) {
    throw Error('Failed to verify user on referenced link');
  }
  const updatedLink = loadedLinkObj;
  const lastCalled = new Date();
  updatedLink.callCounter += 1;
  updatedLink.lastCalled = lastCalled;
  // MIGRATION CODE
  if (!updatedLink.createdDate) {
    updatedLink.createdDate = lastCalled;
  }
  return linkDao.insert(updatedLink).then(() => res.redirect(loadedLinkObj.linkUrl));
};

const loadAndUpdateLinkAndForward = (claim, linkId, res) => linkDao.getById(linkId)
  .then(loadedLinkObj => updateLinkAndForward(loadedLinkObj, claim, res));

const leave = (req, res) => {
  if (req.cookies.authToken) {
    const { target } = req.query;
    const { authToken } = req.cookies;
    JwtUtil.verify(authToken)
      .then(claim => loadAndUpdateLinkAndForward(claim, target, res))
      .catch((e) => {
        winston.loggers.get('application').error(e);
      });
  }
};

export default (app) => {
  app.get('/leave', leave);
};
