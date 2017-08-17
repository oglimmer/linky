
import BaseDataAccessObject from './BaseDataAccessObject';

class FeedUpdatesDao extends BaseDataAccessObject {
  getByLinkId(linkId) {
    return this.listByView('feedUpdates', 'byLinkId', linkId).then(this.getFirstElement);
  }
}

export default new FeedUpdatesDao();
