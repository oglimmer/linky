
import asyncWaitDao from '../dao/asyncWaitDao';

export default () => {
  /* eslint-disable no-underscore-dangle */
  asyncWaitDao.getAllAsyncWaits()
    .then(rows => rows.forEach(rec => asyncWaitDao.delete(rec._id, rec._rev)));
/* eslint-enable no-underscore-dangle */
};
