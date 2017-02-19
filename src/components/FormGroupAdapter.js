
import React, { PropTypes } from 'react';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { Control } from 'react-redux-form';

import FormControlAdapter from './FormControlAdapter';

const FormGroupAdapter = ({ label, model, placeholder, autoFocus, autoComplete }) => (
  <FormGroup
    controlId="email"
  >
    <ControlLabel>{label}</ControlLabel>
    <Control.text
      model={`.${model}`}
      component={FormControlAdapter}
      autoFocus={autoFocus}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
    <FormControl.Feedback />
  </FormGroup>
);
FormGroupAdapter.propTypes = {
  label: PropTypes.string.isRequired,
  model: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  autoFocus: PropTypes.string,
  autoComplete: PropTypes.string,
};
FormGroupAdapter.defaultProps = {
  autoFocus: '',
  autoComplete: '',
};

export default FormGroupAdapter;
