
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
  if (extId.indexOf('?') > -1) {
    extId = extId.substr(0, extId.indexOf('?'));
  }
  let endPos = extId.indexOf('/');
  let filename;
  if (endPos === -1) {
    filename = 'index.html';
    endPos = extId.length;
  } else {
    filename = extId.substr(endPos + 1);
  }
  const archiveid = extId.substr(0, endPos);
  const archivePath = path.join(properties.server.archive.cachePath, userhash, archiveid);
  return [archivePath, archiveid, userhash, filename];
};

const handleContentTypeForSpecialUrls = (req, userhash, archiveid, filename) => {
  if (req.url.endsWith('.php')) {
    const mimeFile = path.join(properties.server.archive.cachePath, userhash, archiveid, 'SCRAPED_MIME_TYPE_MAP');
    const map = new Map(JSON.parse(fs.readFileSync(mimeFile, { encoding: 'utf-8' })));
    const contentType = map.get(filename);
    if (contentType) {
      req.SAVED_CONTENTTYPE = contentType;
    }
  }
};

const ensureFilesOnCacheAndSecurity = (req, res, next) => {
  const tmpAuthToken = req.query.tmpAuthToken ? req.query.tmpAuthToken : req.cookies.tmpAuthToken;
  if (req.query.tmpAuthToken) {
    res.cookie('tmpAuthToken', req.query.tmpAuthToken);
    // security: don't keep the token in the url
    res.redirect(req.originalUrl.substr(0, req.originalUrl.indexOf('?')));
  } else {
    JwtUtil.verify(tmpAuthToken)
      .then((claim) => {
        const [archivePath, archiveid, userhash, filename] = getParameterFromUrl(req);
        if (userhash !== claim.archiveUserHash) {
          throw new Error();
        }
        fs.stat(archivePath)
          .then(() => {
            handleContentTypeForSpecialUrls(req, userhash, archiveid, filename);
            next();
          })
          .catch(() => {
            Promise.all([
              archiveDao.getById(archiveid),
              fs.ensureDir(archivePath),
            ]).then(() => {
              winston.loggers.get('application').debug('unzipping %s ...', archiveid);
              const targetStream = unzip.Extract({ path: archivePath });
              targetStream.on('close', () => {
                handleContentTypeForSpecialUrls(req, userhash, archiveid, filename);
                next();
              });
              archiveDao.attachmentGet(archiveid, 'archive').pipe(targetStream);
            }).catch((err) => {
              winston.loggers.get('application').warn('Unable to find %s - %s', archiveid, err);
              next();
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
  app.use('/archive', express.static(path.join(properties.server.archive.cachePath), {
    setHeaders: (res) => {
      // FILE `SCRAPED_MIME_TYPE_MAP`
      // .php files contain virtually anything (like html, js or css). so the content-type
      // cannot be derived from the file extension. therefore we use the file
      // `SCRAPED_MIME_TYPE_MAP` which was saved during web scrape time
      if (res.req.SAVED_CONTENTTYPE) {
        res.setHeader('content-type', res.req.SAVED_CONTENTTYPE);
      }
    },
  }));
  app.use('/archive', (req, res) => {
    res.status(404).send('404 - Page Not Found');
  });
};
