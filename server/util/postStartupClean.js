
import asyncWaitDao from '../dao/asyncWaitDao';

export default async () => {
  const rows = await asyncWaitDao.getAllAsyncWaits();
  /* eslint-disable no-underscore-dangle */
  rows.forEach(rec => asyncWaitDao.delete(rec._id, rec._rev));
/* eslint-enable no-underscore-dangle */
};
