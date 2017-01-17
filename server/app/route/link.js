
const linkController = require('../controller/linkController');
const authorizationController = require('../controller/authorizationController');

module.exports = (app) => {
  app.post('/rest/links', authorizationController.checkAuthorization, linkController.createLink);
  app.get('/rest/links', authorizationController.checkAuthorization, linkController.getLinkCollection);
  app.delete('/rest/links/:linkid', authorizationController.checkAuthorization, linkController.deleteLink);
};
