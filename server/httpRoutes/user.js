
import userController from '../controller/userController';
import authorizationController from '../controller/authorizationController';

export default (app) => {
  app.post('/rest/authenticate', userController.authenticate);
  app.post('/rest/logout', authorizationController.checkAuthorization, userController.logout);
  app.post('/rest/users', userController.createUser);
  app.get('/rest/users/me', authorizationController.checkAuthorization, userController.getUser);
};
