
import React from 'react';
import PropTypes from 'prop-types';

import { Provider } from 'react-redux';

import { BrowserRouter } from 'react-router-dom';
import { startRssUpdates } from '../redux/actions';

import Routing from '../routes/Routing';


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
        <BrowserRouter>
          <Routing store={this.store} />
        </BrowserRouter>
      </Provider>
    );
  }

}
Root.propTypes = {
  store: PropTypes.shape().isRequired,
};

export default Root;
