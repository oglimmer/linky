
import userController from '../controller/userController';

export default (app) => {
  app.post('/rest/authenticate', userController.authenticate);
  app.post('/rest/logout', userController.logout);
  app.post('/rest/users', userController.createUser);
};
