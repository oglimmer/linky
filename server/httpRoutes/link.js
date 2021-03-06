
import linkController from '../controller/linkController';
import importExportController from '../controller/importExportController';
import authorizationController from '../controller/authorizationController';
import imageController from '../controller/imageController';
import searchController from '../controller/searchController';
import archiveController from '../controller/archiveController';

export default (app) => {
  app.post('/rest/links', authorizationController.checkAuthorization, linkController.createLink);
  app.put('/rest/links/:linkid', authorizationController.checkAuthorization, linkController.updateLink);
  app.get('/rest/links/:tags', authorizationController.checkAuthorization, linkController.getLinkCollection);
  app.delete('/rest/links/:linkid', authorizationController.checkAuthorization, linkController.deleteLink);
  app.get('/rest/links/:linkid/favicon', authorizationController.checkAuthorization, imageController.getFavicon);
  app.patch('/rest/links/tags', authorizationController.checkAuthorization, linkController.batchModifyLinksForTag);
  app.patch('/rest/links/import', authorizationController.checkAuthorization, importExportController.import);
  app.get('/rest/export/links', authorizationController.checkAuthorization, importExportController.export);
  app.get('/rest/import/ready', authorizationController.checkAuthorization, importExportController.importReady);
  app.get('/rest/search/links', authorizationController.checkAuthorization, searchController.search);
  app.post('/rest/archive/:linkid', authorizationController.checkAuthorization, archiveController.createArchive);
};
