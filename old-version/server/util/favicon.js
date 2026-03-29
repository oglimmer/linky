
import favicon from 'favicon';
import { Promise } from 'bluebird';
import request from 'request-promise';

const promisedFavicon = Promise.promisify(favicon);

export default async (url) => {
  try {
    const faviconUrl = await promisedFavicon(url, { timeout: 15000 });
    if (!faviconUrl) {
      return null;
    }
    const response = await request.get(faviconUrl, { resolveWithFullResponse: true });
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      return null;
    }
    const faviconBlob = response.body;
    if (faviconBlob) {
      return faviconUrl;
    }
  } catch (err) {
    // just ignore
  }
  return null;
};
