
import BaseDataAccessObject from './BaseDataAccessObject';

export class LinkDao extends BaseDataAccessObject {
  async listAll() {
    const body = await this.dbrefs.view('links', 'byUserid');
    return body.rows.map(e => e.value);
  }

  listByUserid(userid) {
    return this.listByView('links', 'byUserid', userid);
  }

  listByUseridAndTag(userid, tag) {
    return this.listByViewMultiParams('links', 'byUseridAndTag', [userid, tag], [userid, tag], {});
  }

  async listByUseridAndUrl(userid, url) {
    const body = await this.listByViewMultiParams('links', 'byUseridAndMiniUrl', [userid, url], [userid, url], {});
    return body.map(e => e.value);
  }
}

export default new LinkDao();
