
import tagController from '../controller/tagController';
import authorizationController from '../controller/authorizationController';

export default (app) => {
  app.get('/rest/tags', authorizationController.checkAuthorization, tagController.getTagCollection);
  app.get('/rest/tags/hierarchy', authorizationController.checkAuthorization, tagController.getTagHierarchy);
  app.put('/rest/tags/hierarchy', authorizationController.checkAuthorization, tagController.persistTagHierarchy);
};
