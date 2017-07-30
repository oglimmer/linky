
import favicon from 'favicon';
import { Promise } from 'bluebird';
import request from 'request-promise';

const promisedFavicon = Promise.promisify(favicon);

export default url => promisedFavicon(url).then((faviconUrl) => {
  if (!faviconUrl) {
    return null;
  }
  return request.get(faviconUrl, { resolveWithFullResponse: true }).then((response) => {
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      return null;
    }
    const faviconBlob = response.body;
    if (faviconBlob) {
      return faviconUrl;
    }
    return null;
  }).catch(() => null);
}).catch(() => null);
