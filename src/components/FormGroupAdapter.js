
const React = require('react');
const { FormGroup, ControlLabel, FormControl } = require('react-bootstrap');
const { Control } = require('react-redux-form');

const FormControlAdapter = require('./FormControlAdapter');

const { PropTypes } = React;

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
FormGroupAdapter.defaultProps = {
  autoFocus: '',
};

module.exports = FormGroupAdapter;
