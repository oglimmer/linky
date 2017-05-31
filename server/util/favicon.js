
import favicon from 'favicon';
import { Promise } from 'bluebird';
import request from 'request-promise';

const promisedFavicon = Promise.promisify(favicon);

export default url => promisedFavicon(url).then((faviconUrl) => {
  if (!faviconUrl) {
    return null;
  }
  return request.get(faviconUrl).then((faviconBlob) => {
    if (faviconBlob) {
      return faviconUrl;
    }
    return null;
  }).catch(() => null);
}).catch(() => null);
