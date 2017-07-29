
import favicon from 'favicon';
import { Promise } from 'bluebird';
import request from 'request-promise';
import winston from 'winston';

const promisedFavicon = Promise.promisify(favicon);

export default url => promisedFavicon(url).then((faviconUrl) => {
  if (!faviconUrl) {
    return null;
  }
  return request.get(faviconUrl, { resolveWithFullResponse: true }).then((response) => {
    const contentType = response.headers['content-type'];
    winston.loggers.get('application').debug('Favicon %s has content-type of %s', faviconUrl, contentType);
    if (contentType && contentType.startsWith('text/html')) {
      return null;
    }
    const faviconBlob = response.body;
    if (faviconBlob) {
      return faviconUrl;
    }
    return null;
  }).catch(() => null);
}).catch(() => null);
