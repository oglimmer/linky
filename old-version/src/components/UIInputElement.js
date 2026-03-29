
import React from 'react';
import PropTypes from 'prop-types';
import { ControlLabel, Col } from 'react-bootstrap';
import { Control } from 'react-redux-form';

import FormControlAdapter from './FormControlAdapter';

const UIInputElement = ({ label, componentClass, model, placeholder, autoFocus,
  autoComplete, cols }) =>
  (<span>
    <Col componentClass={ControlLabel} sm={1}>{label}</Col>
    <Col sm={cols}>
      <Control
        type={componentClass === 'password' ? 'password' : 'text'}
        componentClass={componentClass}
        model={`.${model}`}
        component={FormControlAdapter}
        autoFocus={autoFocus}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </Col>
  </span>);

UIInputElement.propTypes = {
  label: PropTypes.string.isRequired,
  componentClass: PropTypes.string,
  model: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  autoFocus: PropTypes.string,
  autoComplete: PropTypes.string,
  cols: PropTypes.number,
};
UIInputElement.defaultProps = {
  autoFocus: '',
  autoComplete: '',
  componentClass: 'input',
  cols: 5,
};

export default UIInputElement;
