
const BaseDataAccessObject = require('./BaseDataAccessObject');

class UserDao extends BaseDataAccessObject {

  getByEmail(email) {
    return this.listByView('users', 'byEmail', email).then(this.getFirstElement);
  }

}

module.exports = new UserDao();
