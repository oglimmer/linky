
import BaseDataAccessObject from './BaseDataAccessObject';

class VisitorDao extends BaseDataAccessObject {
  getByVisitorId(visitorId) {
    return this.listByView('visitors', 'byVisitorId', visitorId).then(this.getFirstElement);
  }
}

export default new VisitorDao();
