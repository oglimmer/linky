
import linkController from '../controller/linkController';
import authorizationController from '../controller/authorizationController';

export default (app) => {
  app.post('/rest/links', authorizationController.checkAuthorization, linkController.createLink);
  app.get('/rest/links/:tags', authorizationController.checkAuthorization, linkController.getLinkCollection);
  app.delete('/rest/links/:linkid', authorizationController.checkAuthorization, linkController.deleteLink);
};
