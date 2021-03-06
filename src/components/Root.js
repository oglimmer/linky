
import React from 'react';
import PropTypes from 'prop-types';

import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

import { startRssUpdates } from '../redux/actions/links';
import AlertAdapter from '../components/AlertAdapter';

import Routing from '../routes/Routing';

import history from '../util/history';

class Root extends React.Component {
  static propTypes = {
    store: PropTypes.shape().isRequired,
  };

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
        <div>
          <AlertAdapter />
          <ConnectedRouter history={history.history}>
            <Routing store={this.store} />
          </ConnectedRouter>
        </div>
      </Provider>
    );
  }
}

export default Root;
