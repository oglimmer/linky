
import winston from 'winston';
import request from 'request';
import fs from 'fs-extra';

import linkDao from '../dao/linkDao';
import ResponseUtil from '../../src/util/ResponseUtil';
import BaseProcessor from './BaseProcessor';

import properties from '../util/linkyproperties';

class GetFaviconProcessor extends BaseProcessor {
  constructor(req, res, next) {
    super(req, res, next, true);
  }

  collectBodyParameters() {
    const { linkid } = this.req.params;
    this.data = { linkid };
  }

  async process() {
    try {
      const file = `${properties.server.favicon.cachePath}/${this.data.linkid}`;
      try {
        await fs.stat(file);
        const contentType = fs.readFileSync(`${file}.contentType`);
        this.res.append('content-type', contentType);
        this.res.append('Cache-Control', 'max-age=31536000');
        const inputStream = fs.createReadStream(file);
        inputStream.on('open', () => {
          inputStream.pipe(this.res);
        });
        inputStream.on('error', (err) => {
          this.res.end(err);
        });
      } catch (noCacheFile) {
        const rec = await linkDao.getById(this.data.linkid);
        let outputStream;
        request({
          method: 'GET',
          uri: rec.faviconUrl,
          gzip: true,
        })
          .on('response', (response) => {
            const contentType = response.headers['content-type'];
            this.res.append('Cache-Control', 'max-age=31536000');
            if (contentType.indexOf('image') > -1) {
              outputStream = fs.createWriteStream(file);
              this.res.append('content-type', contentType);
              fs.writeFileSync(`${file}.contentType`, contentType);
            } else {
              const fallbackIcon = fs.readFileSync('./dist/static/default.png');
              this.res.append('content-type', 'image/png');
              this.res.write(fallbackIcon);
            }
          })
          .on('data', (data) => {
            if (outputStream) {
              this.res.write(data);
              outputStream.write(data);
            }
          })
          .on('complete', () => {
            this.res.end();
            if (outputStream) {
              outputStream.end();
            }
          })
          .on('error', () => {
            this.res.end();
            if (outputStream) {
              outputStream.end();
            }
          });
      }
    } catch (err) {
      winston.loggers.get('application').error(err);
      ResponseUtil.sendErrorResponse500(err, this.res);
    }
  }
}

export default {

  getFavicon: (req, res, next) => {
    const glp = new GetFaviconProcessor(req, res, next);
    glp.doProcess();
  },


};
