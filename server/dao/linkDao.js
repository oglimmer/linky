
const BaseDataAccessObject = require('./BaseDataAccessObject');

class LinkDao extends BaseDataAccessObject {

  listByUserid(userid) {
    return this.listByView('links', 'byUserid', userid);
  }

}

module.exports = new LinkDao();
