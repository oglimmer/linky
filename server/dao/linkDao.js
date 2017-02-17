
import BaseDataAccessObject from './BaseDataAccessObject';

class LinkDao extends BaseDataAccessObject {

  listByUserid(userid) {
    return this.listByView('links', 'byUserid', userid);
  }

}

export default new LinkDao();
