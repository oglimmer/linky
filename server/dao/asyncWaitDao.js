
import BaseDataAccessObject from './BaseDataAccessObject';

class AsyncWaitDao extends BaseDataAccessObject {

  getAllAsyncWaits() {
    return this.listByView('asyncWait', 'allAsyncwaits')
      .then(data => data.map(e => e.value));
  }

  getAsyncWaitByByUser(userid) {
    return this.listByView('asyncWait', 'byUserId', userid)
      .then(data => data.map(e => e.value));
  }

  getAsyncWaitByByUserAndObject(userid, object) {
    return this.listByViewMultiParams('asyncWait', 'byUserIdAndObject', [userid, object], [userid, object], {})
      .then(this.getFirstElement);
  }

}

export default new AsyncWaitDao();
