
import BaseDataAccessObject from './BaseDataAccessObject';

export class LinkDao extends BaseDataAccessObject {

  listAll() {
    return this.dbrefs.view('links', 'byUserid').then(body => body.rows.map(e => e.value));
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
