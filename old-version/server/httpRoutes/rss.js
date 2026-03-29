
import rssController from '../controller/rssController';
import authorizationController from '../controller/authorizationController';

export default (app) => {
  app.get('/rest/links/:linkId/rss', authorizationController.checkAuthorization, rssController.getRssUpdatesCollection);
  app.get('/rest/links/:linkId/rssDetails', authorizationController.checkAuthorization, rssController.getRssUpdatesDetails);
};
