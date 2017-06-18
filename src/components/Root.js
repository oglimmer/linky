
import React from 'react';
import PropTypes from 'prop-types';

import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

import { startRssUpdates } from '../redux/actions';

import Routing from '../routes/Routing';

import history from '../util/history';

class Root extends React.Component {

  constructor({ store }) {
    super();
    this.store = store;
  }

  componentDidMount() {
    this.store.dispatch(startRssUpdates());
  }

  render() {
    return (
      <Provider store={this.store}>
        <ConnectedRouter history={history.history}>
          <Routing store={this.store} />
        </ConnectedRouter>
      </Provider>
    );
  }

}
Root.propTypes = {
  store: PropTypes.shape().isRequired,
};

export default Root;
