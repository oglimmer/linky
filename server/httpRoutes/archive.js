
import archiveController from '../controller/archiveController';

export default (app) => {
  app.use('/archive', archiveController.ensureFilesOnCacheAndSecurity);
  app.use('/archive', archiveController.serveStatic);
  app.use('/archive', (req, res) => {
    res.status(404).send('404 - Page Not Found');
  });
};
