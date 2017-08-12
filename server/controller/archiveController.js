
import winston from 'winston';
import scrape from 'website-scraper';
import path from 'path';
import archiver from 'archiver';
import crypto from 'crypto';

import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';
import linkDao from '../dao/linkDao';
import archiveDao from '../dao/archiveDao';
import { updateTagHierarchy, createObject } from '../logic/Link';
import { ALL, ARCHIVE } from '../../src/util/TagRegistry';

import properties from '../util/linkyproperties';

const zip = (pathToZip, archiveRec) => new Promise((resolve, reject) => {
  const output = archiveDao.attachmentInsert(archiveRec.id, 'archive', null, 'application/zip', { rev: archiveRec.rev });
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

const createUserHash = (userid) => {
  const hashUser = crypto.createHash('sha256');
  hashUser.update(userid);
  return hashUser.digest('hex');
};

class CreateArchiveProcessor extends BaseProcessor {

  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { linkid } = this.req.params;
    this.data = { linkid };
  }

  * process() {
    try {
      const linkRec = yield linkDao.getById(this.data.linkid);
      if (linkRec.userid !== this.data.userid) {
        throw new Error('Forbidden');
      }
      const archiveRec = yield archiveDao.insert({
        userid: this.data.userid,
        createdDate: new Date(),
        linkid: this.data.linkid,
        url: linkRec.linkUrl,
        type: 'archive',
      });
      const userHash = createUserHash(this.data.userid);
      const cachePath = path.join(properties.server.archive.cachePath, userHash, archiveRec.id);
      const options = {
        urls: [linkRec.linkUrl],
        directory: cachePath,
      };
      yield scrape(options);
      zip(cachePath, archiveRec);
      const newRecord = createObject({
        linkUrl: `/archive/${userHash}/${archiveRec.id}`,
        userid: this.data.userid,
        notes: `Archived ${linkRec.linkUrl} on ${new Date()}`,
        tags: [ALL, ARCHIVE],
        pageTitle: `[ARCHIVE] ${linkRec.pageTitle}`,
        faviconUrl: linkRec.faviconUrl,
      });
      const { id } = yield linkDao.insert(newRecord);
      newRecord.id = id;
      updateTagHierarchy(this.data.userid, newRecord.tags);
      this.res.send({ primary: newRecord });
      winston.loggers.get('application').debug('Created archive db: %j', newRecord);
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
