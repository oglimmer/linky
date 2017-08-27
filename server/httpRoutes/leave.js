
import leaveController from '../controller/leaveController';

export default (app) => {
  app.get('/leave', leaveController.leave);
};
