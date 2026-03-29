
import BaseDataAccessObject from './BaseDataAccessObject';

class FeedUpdatesDao extends BaseDataAccessObject {
  getByLinkId(linkId) {
    return this.listByView('feedUpdates', 'byLinkId', linkId).then(this.getFirstElement);
  }

  getByUserId(linkId) {
    return this.listByView('feedUpdates', 'byUserId', linkId);
  }
}

export default new FeedUpdatesDao();
