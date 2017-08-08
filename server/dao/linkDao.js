
import { Promise } from 'bluebird';

import BaseDataAccessObject from './BaseDataAccessObject';

import linkyDb from './NanoConnection';

const view = Promise.promisify(linkyDb.view);

export class LinkDao extends BaseDataAccessObject {

  static listAll() {
    return view('links', 'byUserid').then(body => body.rows.map(e => e.value));
  }

  listByUserid(userid) {
    return this.listByView('links', 'byUserid', userid);
  }

  listByUseridAndTag(userid, tag) {
    return this.listByViewMultiParams('links', 'byUseridAndTag', [userid, tag], [userid, tag], {});
  }

  listByUseridAndUrl(userid, url) {
    return this.listByViewMultiParams('links', 'byUseridAndMiniUrl', [userid, url], [userid, url], {})
      .then(rows => rows.map(e => e.value));
  }

}

export default new LinkDao();
