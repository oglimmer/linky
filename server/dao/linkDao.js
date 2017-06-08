
import { Promise } from 'bluebird';

import BaseDataAccessObject from './BaseDataAccessObject';

import linkyDb from './NanoConnection';

const view = Promise.promisify(linkyDb.view);

class LinkDao extends BaseDataAccessObject {

  /* eslint-disable class-methods-use-this */
  listAll() {
    return view('links', 'byUserid').then(body => body.rows.map(e => e.value));
  }
  /* eslint-enable class-methods-use-this */

  listByUserid(userid) {
    return this.listByView('links', 'byUserid', userid);
  }

  listByUseridAndTag(userid, tag) {
    return this.listByViewMultiParams('links', 'byUseridAndTag', [userid, tag], [userid, tag], {});
  }

}

export default new LinkDao();
