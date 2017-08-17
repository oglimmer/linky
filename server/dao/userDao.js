
import BaseDataAccessObject from './BaseDataAccessObject';

class UserDao extends BaseDataAccessObject {
  getByEmail(email) {
    return this.listByView('users', 'byEmail', email.toLowerCase()).then(this.getFirstElement);
  }

  getBySourceId(sourceId) {
    return this.listByView('users', 'bySourceId', sourceId).then(this.getFirstElement);
  }
}

export default new UserDao();
