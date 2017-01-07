'use strict';

var linkController = require('../controller/linkController');
var authorizationController = require('../controller/authorizationController');

module.exports = function(app) {
	app.post('/rest/links', authorizationController.checkAuthorization, linkController.createLink);
	app.get('/rest/links', authorizationController.checkAuthorization, linkController.getLinkCollection);
	app.delete('/rest/links/:linkid', authorizationController.checkAuthorization, linkController.deleteLink);
};
