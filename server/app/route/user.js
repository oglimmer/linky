'use strict';

var userController = require('../controller/userController');

module.exports = function(app) {
    app.post('/rest/authenticate', userController.authenticate);
    app.post('/rest/users', userController.createUser);
};
