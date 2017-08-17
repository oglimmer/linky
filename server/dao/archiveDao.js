
import BaseDataAccessObject from './BaseDataAccessObject';

import { archiveDb } from './NanoConnection';
import { hashSha256Hex } from '../util/HashUtil';

class ArchiveDao extends BaseDataAccessObject {
  constructor() {
    super(archiveDb);
  }

  getByUserIdAndArchiveLinkId(userid, archivedLinkid) {
    const key = `${hashSha256Hex(userid)}/${archivedLinkid}`;
    return this.listByView('archives', 'byUserIdAndArchiveLinkId', key).then(this.getFirstElement);
  }

  attachmentInsert(docname, attname, att, contenttype, params) {
    return this.dbrefs.attachment.insert(docname, attname, att, contenttype, params);
  }

  attachmentGet(docname, attname) {
    return this.dbrefs.attachment.get(docname, attname);
  }
}

export default new ArchiveDao();
