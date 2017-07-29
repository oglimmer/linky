
import asyncWaitDao from '../dao/asyncWaitDao';

export default () => {
  asyncWaitDao.getAllAsyncWaits().then((rows) => rows.forEach((rec) => {
    /* eslint-disable no-underscore-dangle */
    asyncWaitDao.delete(rec._id, rec._rev);
    /* eslint-enable no-underscore-dangle */
  }));
};
