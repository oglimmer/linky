
import winston from 'winston';
import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import unzip from 'unzipper';
import { Promise } from 'bluebird';

import archiveDao from '../dao/archiveDao';
import properties from '../util/linkyproperties';
import JwtUtil from '../util/JwtUtil';

const getParameterFromUrl = (req) => {
  let extId = req.url.substr(1); // remove starting /
  const userhash = extId.substr(0, extId.indexOf('/')); // char seq between two slashes
  extId = extId.substr(extId.indexOf('/') + 1); // cut userid
  let endPos = extId.indexOf('/');
  if (endPos === -1) {
    if (extId.indexOf('?') > -1) {
      endPos = extId.indexOf('?');
    } else {
      endPos = extId.length;
    }
  }
  const archiveid = extId.substr(0, endPos);
  const archivePath = path.join(properties.server.archive.cachePath, userhash, archiveid);
  return [archivePath, archiveid, userhash];
};

const ensureFilesOnCacheAndSecurity = (req, res, next) => {
  const tmpAuthToken = req.query.tmpAuthToken ? req.query.tmpAuthToken : req.cookies.authToken;
  if (req.query.tmpAuthToken) {
    res.cookie('authToken', req.query.tmpAuthToken);
    // security: don't keep the token in the url
    res.redirect(req.originalUrl.substr(0, req.originalUrl.indexOf('?')));
  } else {
    JwtUtil.verify(tmpAuthToken)
      .then((claim) => {
        const [archivePath, archiveid, userhash] = getParameterFromUrl(req);
        if (userhash !== claim.archiveUserHash) {
          throw new Error();
        }
        fs.stat(archivePath).then(() => {
          next();
        }).catch(() => {
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
      })
      .catch(() => {
        res.status(403).send('403 - Forbidden');
      });
  }
};

export default (app) => {
  app.use('/archive', ensureFilesOnCacheAndSecurity);
  app.use('/archive', express.static(path.join(properties.server.archive.cachePath)));
  app.use('/archive', (req, res) => {
    res.status(404).send('404 - Page Not Found');
  });
};
