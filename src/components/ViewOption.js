
import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'react-bootstrap';
import { connect } from 'react-redux';

import { toggleColumnView } from '../redux/actions/links';

// ----------------------Presentational Component-----------------------------------

const ViewOption = ({ name, label, onChange, checked }) => (
  <Checkbox inline={!false} onChange={() => onChange(name)} checked={checked} >
    {label}
  </Checkbox>
);
ViewOption.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  checked: PropTypes.bool.isRequired,
};

// ----------------------Container Component-----------------------------------

const mapStateToProps = (state, ownProps) => ({
  checked: !!state.mainData.listColumns.find(c => c === ownProps.name),
});

const mapDispatchToProps = dispatch => ({
  onChange: name => dispatch(toggleColumnView(name)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ViewOption);
