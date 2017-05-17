
import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { Control } from 'react-redux-form';

import FormControlAdapter from './FormControlAdapter';

const FormGroupAdapter = ({ label, type, model, placeholder, autoFocus, autoComplete }) => (
  <FormGroup
    controlId={model}
  >
    <ControlLabel>{label}</ControlLabel>
    <Control
      type={type}
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
  type: PropTypes.string,
  model: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  autoFocus: PropTypes.string,
  autoComplete: PropTypes.string,
};
FormGroupAdapter.defaultProps = {
  autoFocus: '',
  autoComplete: '',
  type: 'text',
};

export default FormGroupAdapter;
