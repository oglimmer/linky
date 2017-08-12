
import winston from 'winston';
import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import unzip from 'unzipper';
import { Promise } from 'bluebird';

import archiveDao from '../dao/archiveDao';
import properties from '../util/linkyproperties';

const getParameterFromUrl = (req) => {
  let extId = req.url.substr(1); // remove starting /
  const userhash = extId.substr(0, extId.indexOf('/')); // char seq between two slashes
  extId = extId.substr(extId.indexOf('/') + 1); // cut userid
  const archiveid = extId.substr(0, extId.indexOf('/') > -1 ? extId.indexOf('/') : extId.length);
  const archivePath = path.join(properties.server.archive.cachePath, userhash, archiveid);
  return [archivePath, archiveid];
};

const ensureFilesOnCache = (req, res, next) => {
  const [archivePath, archiveid] = getParameterFromUrl(req);
  winston.loggers.get('application').debug('looking for archive: %s |||%s', archivePath, archiveid);
  fs.stat(archivePath).then(() => {
    winston.loggers.get('application').debug('archive %s found', archiveid);
    next();
  }).catch(() => {
    winston.loggers.get('application').debug('archive %s not found', archiveid);
    Promise.all([
      archiveDao.getById(archiveid),
      fs.ensureDir(archivePath),
    ]).then(([rec]) => {
      if (rec) {
        winston.loggers.get('application').debug('unzipping %s ...', archiveid);
        const targetStream = unzip.Extract({ path: archivePath });
        targetStream.on('close', () => {
          next();
        });
        archiveDao.attachmentGet(archiveid, 'archive').pipe(targetStream);
      }
    });
  });
};

export default (app) => {
  app.use('/archive', ensureFilesOnCache);
  app.use('/archive', express.static(path.join(properties.server.archive.cachePath)));
  app.use('/archive', (req, res) => {
    res.status(404).send('404 - Page Not Found');
  });
};
