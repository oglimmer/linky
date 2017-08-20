
import winston from 'winston';
import scrape from 'website-scraper';
import path from 'path';
import archiver from 'archiver';
import fs from 'fs-extra';

import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import linkDao from '../dao/linkDao';
import archiveDao from '../dao/archiveDao';
import { updateTagHierarchy, createObject } from '../logic/Link';
import { ALL, ARCHIVE } from '../../src/util/TagRegistry';
import { hashSha256Hex } from '../util/HashUtil';

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

  initArchiveRec(userHash, url) {
    const archiveRec = {
      userid: this.data.userid,
      userHash,
      createdDate: new Date(),
      originalLinkid: this.data.linkid,
      url,
      type: 'archive',
    };
    return archiveDao.insert(archiveRec).then(({ id, rev }) => {
      archiveRec._id = id;
      archiveRec._rev = rev;
      return archiveRec;
    });
  }

  static updateArchiveRec(archiveRec, archiveLinkRecId) {
    /* eslint-disable no-param-reassign */
    archiveRec.archiveLinkid = archiveLinkRecId;
    return archiveDao.insert(archiveRec).then(({ rev }) => {
      archiveRec._rev = rev;
    });
    /* eslint-enable no-param-reassign */
  }

  createLinkRec(userHash, archiveRecId, linkRec) {
    const newRecord = createObject({
      linkUrl: `${properties.server.archive.domain}/archive/${userHash}/${archiveRecId}`,
      userid: this.data.userid,
      notes: `Archived ${linkRec.linkUrl} on ${new Date()}`,
      tags: [ALL, ARCHIVE],
      pageTitle: `[ARCHIVE] ${linkRec.pageTitle}`,
      faviconUrl: linkRec.faviconUrl,
    });
    return linkDao.insert(newRecord).then(({ id }) => {
      newRecord.id = id;
      return newRecord;
    });
  }

  static scrape(cachePath, url) {
    // we need to store all content-types into the file `SCRAPED_MIME_TYPE_MAP`.
    // see server/httpRoutes/archive.js at "FILE `SCRAPED_MIME_TYPE_MAP`"
    const urlToContentTypeMap = new Map();
    const fileNameToContentTypeMap = new Map();
    return scrape({
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
    })
      .then(() => fs.writeFile(path.join(cachePath, 'SCRAPED_MIME_TYPE_MAP'), JSON.stringify(fileNameToContentTypeMap)));
  }

  * process() {
    try {
      const originalLinkRec = yield linkDao.getById(this.data.linkid);
      if (originalLinkRec.userid !== this.data.userid) {
        throw new Error('Forbidden');
      }
      const userHash = hashSha256Hex(this.data.userid);
      const archiveRec = yield this.initArchiveRec(userHash, originalLinkRec.linkUrl);
      const cachePath = path.join(properties.server.archive.cachePath, userHash, archiveRec._id);
      yield CreateArchiveProcessor.scrape(cachePath, originalLinkRec.linkUrl);
      const archiveLinkRec = yield this.createLinkRec(userHash, archiveRec._id, originalLinkRec);
      yield CreateArchiveProcessor.updateArchiveRec(archiveRec, archiveLinkRec.id);
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

export default {

  createArchive: (req, res, next) => {
    const glp = new CreateArchiveProcessor(req, res, next);
    glp.doProcess();
  },

};
