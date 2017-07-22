
import linkController from '../controller/linkController';
import importExportController from '../controller/importExportController';
import authorizationController from '../controller/authorizationController';
import imageController from '../controller/imageController';

export default (app) => {
  app.post('/rest/links', authorizationController.checkAuthorization, linkController.createLink);
  app.put('/rest/links/:linkid', authorizationController.checkAuthorization, linkController.updateLink);
  app.get('/rest/links/:tags', authorizationController.checkAuthorization, linkController.getLinkCollection);
  app.delete('/rest/links/:linkid', authorizationController.checkAuthorization, linkController.deleteLink);
  app.get('/rest/links/:linkid/favicon', authorizationController.checkAuthorization, imageController.getFavicon);
  app.patch('/rest/links/tags', authorizationController.checkAuthorization, linkController.batchModifyLinksForTag);
  app.patch('/rest/links/import', authorizationController.checkAuthorization, importExportController.import);
};
