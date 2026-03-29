
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Control, Form, actions } from 'react-redux-form';

import { sendSearch, fetchLinks } from '../redux/actions/links';

const InputNavItem = ({ onSearch, onClear, searchTerm, location }) => (
  <li role="presentation">
    { location.pathname.startsWith('/links/') ?
      <Form
        className="navbar-form"
        role="search"
        model="searchBar"
        onSubmit={(formData) => { onSearch(formData.searchTerm); }}
      >
        <div className="input-group">
          <Control
            type="text"
            className="form-control"
            placeholder="Search"
            model=".searchTerm"
          />
          <div className="input-group-btn">
            <button
              className="btn btn-default"
              type="button"
              onClick={() => onSearch(searchTerm)}
            >
              <i className="glyphicon glyphicon-search" />
            </button>
            { searchTerm ?
              <button
                className="btn btn-default"
                type="button"
                onClick={() => { onClear(); }}
              >
                <i className="glyphicon glyphicon-ban-circle" />
              </button> : '' }
          </div>
        </div>
      </Form> : '' }
  </li>
);
InputNavItem.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  location: PropTypes.shape().isRequired,
};

const mapStateToProps = state => ({
  searchTerm: state.searchBar.searchTerm,
});

const mapDispatchToProps = dispatch => ({
  onSearch: (searchString) => {
    if (searchString.trim().length > 0) {
      dispatch(sendSearch(searchString));
    } else {
      dispatch(fetchLinks());
      dispatch(actions.reset('searchBar.serverSide'));
    }
  },
  onClear: () => {
    dispatch(fetchLinks());
    dispatch(actions.reset('searchBar.searchTerm'));
    dispatch(actions.reset('searchBar.serverSide'));
  },
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(InputNavItem));
