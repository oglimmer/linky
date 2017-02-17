
import BaseDataAccessObject from './BaseDataAccessObject';

class UserDao extends BaseDataAccessObject {

  getByEmail(email) {
    return this.listByView('users', 'byEmail', email).then(this.getFirstElement);
  }

}

export default new UserDao();
