
import BaseDataAccessObject from './BaseDataAccessObject';

import { archiveDb } from './NanoConnection';

class ArchiveDao extends BaseDataAccessObject {

  constructor() {
    super(archiveDb);
  }

  getByExtId(extId) {
    return this.listByView('archives', 'byExtId', extId).then(this.getFirstElementRaw);
  }

  attachmentInsert(docname, attname, att, contenttype, params) {
    return this.dbrefs.attachment.insert(docname, attname, att, contenttype, params);
  }

  attachmentGet(docname, attname) {
    return this.dbrefs.attachment.get(docname, attname);
  }

}

export default new ArchiveDao();
