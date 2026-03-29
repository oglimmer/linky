
import properties from '../util/linkyproperties';

export const getArchiveDomain = () => {
  if (properties.server.archive && properties.server.archive.domain) {
    return `${properties.server.archive.protocol}://${properties.server.archive.domain}`;
  }
  return '';
};

export const ensureArchiveDomain = (host) => {
  if (properties.server.archive && properties.server.archive.domain) {
    return host !== properties.server.archive.domain;
  }
  return false;
};

export const ensureNotArchiveDomain = (host) => {
  if (properties.server.archive && properties.server.archive.domain) {
    return host === properties.server.archive.domain;
  }
  return false;
};

export default {};
