
import BaseDataAccessObject from './BaseDataAccessObject';

class TagDao extends BaseDataAccessObject {

  listAllTags(userid) {
    return this.listByViewMultiParams('links', 'allTags', [userid], [userid, {}], { group: true })
      .then(data => data.map(e => [e.key[1], e.value]));
  }

}

export default new TagDao();
