
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

}

export default new LinkDao();
