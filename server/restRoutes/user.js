
const userController = require('../controller/userController');

module.exports = (app) => {
  app.post('/rest/authenticate', userController.authenticate);
  app.post('/rest/users', userController.createUser);
};
