
import { routerMiddleware } from 'react-router-redux';

import createHistory from 'history/createBrowserHistory';

const history = createHistory();
const historyMiddleware = routerMiddleware(history);

export default {
  history,
  historyMiddleware,
};
