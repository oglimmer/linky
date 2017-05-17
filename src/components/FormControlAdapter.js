
import React from 'react';
import PropTypes from 'prop-types';
import { FormControl } from 'react-bootstrap';

const FormControlAdapter = props => (
  <FormControl
    type={props.type}
    value={props.value}
    onChange={props.onChange}
    autoFocus={props.autoFocus}
    placeholder={props.placeholder}
    autoComplete={props.autoComplete}
  />
);
FormControlAdapter.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  autoFocus: PropTypes.string,
  autoComplete: PropTypes.string,
  placeholder: PropTypes.string.isRequired,
};
FormControlAdapter.defaultProps = {
  autoFocus: '',
  autoComplete: '',
};

export default FormControlAdapter;
