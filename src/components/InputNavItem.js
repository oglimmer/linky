
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setInSearchMode } from '../redux/actions';
import { sendSearch, fetchLinks } from '../redux/actions/links';

class InputNavItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = { value: '' };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  render() {
    return (
      <div className="col-sm-6 col-md-6 pull-right">
        <form className="navbar-form" role="search">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search"
              name="srch-term"
              id="srch-term"
              value={this.state.value}
              onChange={this.handleChange}
            />
            <div className="input-group-btn">
              <button
                className="btn btn-default"
                type="button"
                onClick={() => this.props.onClick(this.state.value)}
              >
                <i className="glyphicon glyphicon-search" />
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}
InputNavItem.propTypes = {
  onClick: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  onClick: (searchString) => {
    if (searchString.trim().length > 0) {
      dispatch(sendSearch(searchString));
    } else {
      dispatch(setInSearchMode(false));
      dispatch(fetchLinks('portal'));
    }
  },
});

export default connect(null, mapDispatchToProps)(InputNavItem);
