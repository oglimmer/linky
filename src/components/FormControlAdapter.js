
import React, { PropTypes } from 'react';
import { FormControl } from 'react-bootstrap';

const FormControlAdapter = props => (
  <FormControl
    type={props.type}
    value={props.value}
    onChange={props.onChange}
    autoFocus={props.autoFocus}
    placeholder={props.placeholder}
  />
);
FormControlAdapter.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  autoFocus: PropTypes.string,
  placeholder: PropTypes.string.isRequired,
};
FormControlAdapter.defaultProps = {
  autoFocus: '',
};

export default FormControlAdapter;
