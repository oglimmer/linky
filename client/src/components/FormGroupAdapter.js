
import React, { PropTypes } from 'react';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { Control } from 'react-redux-form';

import FormControlAdapter from './FormControlAdapter';

const FormGroupAdapter = ({ label, model, placeholder, autoFocus }) => (
  <FormGroup
    controlId="email"
  >
    <ControlLabel>{label}</ControlLabel>
    <Control.text
      model={`.${model}`}
      component={FormControlAdapter}
      autoFocus={autoFocus}
      placeholder={placeholder}
    />
    <FormControl.Feedback />
  </FormGroup>
);
FormGroupAdapter.propTypes = {
  label: PropTypes.string.isRequired,
  model: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  autoFocus: PropTypes.string,
};

export default FormGroupAdapter;
