
import BaseDataAccessObject from './BaseDataAccessObject';

class TagDao extends BaseDataAccessObject {
  async listAllTags(userid) {
    const data = await this.listByViewMultiParams('links', 'allTags', [userid], [userid, {}], { group: true });
    return data.map(e => [e.key[1], e.value]);
  }

  getHierarchyByUser(userid) {
    return this.listByView('hierarchy', 'byUserId', userid).then(this.getFirstElement);
  }
}

export default new TagDao();
