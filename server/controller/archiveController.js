
import winston from 'winston';
import scrape from 'website-scraper';
import path from 'path';
import archiver from 'archiver';
import fs from 'fs-extra';
import unzip from 'unzipper';
import { Promise } from 'bluebird';
import express from 'express';

import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import linkDao from '../dao/linkDao';
import archiveDao from '../dao/archiveDao';
import { updateTagHierarchy, createObject } from '../logic/Link';
import { ALL, ARCHIVE } from '../../src/util/TagRegistry';
import { hashSha256Hex } from '../util/HashUtil';
import JwtUtil from '../util/JwtUtil';


import properties from '../util/linkyproperties';

/* eslint-disable no-underscore-dangle */

const zip = (pathToZip, archiveRec) => new Promise((resolve, reject) => {
  const output = archiveDao.attachmentInsert(archiveRec._id, 'archive', null, 'application/zip', { rev: archiveRec._rev });
  const archive = archiver('zip', {
    zlib: { level: 5 },
  });
  output.on('close', () => {
    resolve();
  });
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      winston.loggers.get('application').error(err);
    } else {
      reject(err);
    }
  });
  archive.on('error', (err) => {
    reject(err);
  });
  archive.pipe(output);
  archive.directory(pathToZip, false);
  archive.finalize();
});

class CreateArchiveProcessor extends BaseProcessor {
  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { linkid } = this.req.params;
    this.data = { linkid };
  }

  async initArchiveRec(userHash, url) {
    const archiveRec = {
      userid: this.data.userid,
      userHash,
      createdDate: new Date(),
      originalLinkid: this.data.linkid,
      url,
      type: 'archive',
    };
    const { id, rev } = await archiveDao.insert(archiveRec);
    archiveRec._id = id;
    archiveRec._rev = rev;
    return archiveRec;
  }

  static async updateArchiveRec(archiveRec, archiveLinkRecId) {
    /* eslint-disable no-param-reassign */
    archiveRec.archiveLinkid = archiveLinkRecId;
    const { rev } = await archiveDao.insert(archiveRec);
    archiveRec._rev = rev;
    /* eslint-enable no-param-reassign */
  }

  async createLinkRec(userHash, archiveRecId, linkRec) {
    const newRecord = createObject({
      linkUrl: `${properties.server.archive.domain}/archive/${userHash}/${archiveRecId}`,
      userid: this.data.userid,
      notes: `Archived ${linkRec.linkUrl} on ${new Date()}`,
      tags: [ALL, ARCHIVE],
      pageTitle: `[ARCHIVE] ${linkRec.pageTitle}`,
      faviconUrl: linkRec.faviconUrl,
    });
    const { id } = await linkDao.insert(newRecord);
    newRecord.id = id;
    return newRecord;
  }

  static async scrape(cachePath, url) {
    // we need to store all content-types into the file `SCRAPED_MIME_TYPE_MAP`.
    // see server/httpRoutes/archive.js at "FILE `SCRAPED_MIME_TYPE_MAP`"
    const urlToContentTypeMap = new Map();
    const fileNameToContentTypeMap = new Map();
    await scrape({
      urls: [url],
      directory: cachePath,
      httpResponseHandler: (response) => {
        if (response.statusCode === 404) {
          return Promise.reject(new Error('status is 404'));
        }
        const contentType = response.headers['content-type'];
        urlToContentTypeMap.set(response.request.uri.href, contentType);
        return Promise.resolve(response.body);
      },
      onResourceSaved: (resource) => {
        const mimeType = urlToContentTypeMap.get(resource.url);
        fileNameToContentTypeMap.set(resource.filename, mimeType);
      },
      request: {
        headers: {
          'User-Agent': properties.server.archive.userAgent,
        },
      },
    });
    fs.writeFile(path.join(cachePath, 'SCRAPED_MIME_TYPE_MAP'), JSON.stringify(fileNameToContentTypeMap));
  }

  async process() {
    try {
      const originalLinkRec = await linkDao.getById(this.data.linkid);
      if (originalLinkRec.userid !== this.data.userid) {
        throw new Error('Forbidden');
      }
      const userHash = hashSha256Hex(this.data.userid);
      const archiveRec = await this.initArchiveRec(userHash, originalLinkRec.linkUrl);
      const cachePath = path.join(properties.server.archive.cachePath, userHash, archiveRec._id);
      await CreateArchiveProcessor.scrape(cachePath, originalLinkRec.linkUrl);
      const archiveLinkRec = await this.createLinkRec(userHash, archiveRec._id, originalLinkRec);
      await CreateArchiveProcessor.updateArchiveRec(archiveRec, archiveLinkRec.id);
      updateTagHierarchy(this.data.userid, archiveLinkRec.tags);
      zip(cachePath, archiveRec);
      this.res.send({ primary: archiveLinkRec });
      winston.loggers.get('application').debug('Created archive db: %j', archiveLinkRec);
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
    this.res.end();
  }
}

class ReadArchiveController {
  constructor(req, res, next) {
    this.req = req;
    this.res = res;
    this.next = next;
  }

  createParameterFromUrl() {
    let extId = this.req.url.substr(1); // remove starting /
    this.userhash = extId.substr(0, extId.indexOf('/')); // char seq between two slashes
    extId = extId.substr(extId.indexOf('/') + 1); // cut userid
    if (extId.indexOf('?') > -1) {
      extId = extId.substr(0, extId.indexOf('?'));
    }
    let endPos = extId.indexOf('/');
    if (endPos === -1) {
      this.filename = 'index.html';
      endPos = extId.length;
    } else {
      this.filename = extId.substr(endPos + 1);
    }
    this.archiveid = extId.substr(0, endPos);
    this.archivePath = path.join(
      properties.server.archive.cachePath, this.userhash, this.archiveid);
  }

  handleContentTypeForSpecialUrls() {
    if (this.req.url.endsWith('.php')) {
      const mimeFile = path.join(properties.server.archive.cachePath, this.userhash, this.archiveid, 'SCRAPED_MIME_TYPE_MAP');
      const map = new Map(JSON.parse(fs.readFileSync(mimeFile, { encoding: 'utf-8' })));
      const contentType = map.get(this.filename);
      if (contentType) {
        this.req.SAVED_CONTENTTYPE = contentType;
      }
    }
  }

  async restoreArchiveFromDB() {
    try {
      await Promise.all([
        archiveDao.getById(this.archiveid),
        fs.ensureDir(this.archivePath),
      ]);
      winston.loggers.get('application').debug('unzipping %s ...', this.archiveid);
      const targetStream = unzip.Extract({ path: this.archivePath });
      targetStream.on('close', () => {
        this.handleContentTypeForSpecialUrls();
        this.next();
      });
      archiveDao.attachmentGet(this.archiveid, 'archive').pipe(targetStream);
    } catch (err) {
      winston.loggers.get('application').warn('Unable to find %s - %s', this.archiveid, err);
      this.next();
    }
  }

  async serveFiles() {
    try {
      await fs.stat(this.archivePath);
      this.handleContentTypeForSpecialUrls();
      this.next();
    } catch (err) {
      this.restoreArchiveFromDB();
    }
  }

  async ensureFilesOnCacheAndSecurity() {
    if (this.req.query.tmpAuthToken) {
      this.res.cookie('tmpAuthToken', this.req.query.tmpAuthToken);
      // security: don't keep the token in the url
      this.res.redirect(this.req.originalUrl.substr(0, this.req.originalUrl.indexOf('?')));
    } else {
      try {
        const claim = await JwtUtil.verify(this.req.cookies.tmpAuthToken);
        this.createParameterFromUrl();
        if (this.userhash !== claim.archiveUserHash) {
          throw new Error();
        }
        this.serveFiles();
      } catch (err) {
        this.res.status(403).send('403 - Forbidden');
      }
    }
  }
}

export default {

  createArchive: (req, res, next) => {
    const glp = new CreateArchiveProcessor(req, res, next);
    glp.doProcess();
  },

  ensureFilesOnCacheAndSecurity: (req, res, next) => {
    const rac = new ReadArchiveController(req, res, next);
    rac.ensureFilesOnCacheAndSecurity();
  },

  // FILE `SCRAPED_MIME_TYPE_MAP`
  // .php files contain virtually anything (like html, js or css). so the content-type
  // cannot be derived from the file extension. therefore we use the file
  // `SCRAPED_MIME_TYPE_MAP` which was saved during web scrape time
  serveStatic: express.static(path.join(properties.server.archive.cachePath), {
    setHeaders: (res) => {
      if (res.req.SAVED_CONTENTTYPE) {
        res.setHeader('content-type', res.req.SAVED_CONTENTTYPE);
      }
    },
  }),

};
