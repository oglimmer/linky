
import BaseDataAccessObject from './BaseDataAccessObject';

class AsyncWaitDao extends BaseDataAccessObject {
  async getAllAsyncWaits() {
    const data = await this.listByView('asyncWait', 'allAsyncwaits');
    return data.map(e => e.value);
  }

  async getAsyncWaitByByUser(userid) {
    const data = await this.listByView('asyncWait', 'byUserId', userid);
    return data.map(e => e.value);
  }

  getAsyncWaitByByUserAndObject(userid, object) {
    return this.listByViewMultiParams('asyncWait', 'byUserIdAndObject', [userid, object], [userid, object], {})
      .then(this.getFirstElement);
  }
}

export default new AsyncWaitDao();
