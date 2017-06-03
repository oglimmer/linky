
import React from 'react';
import PropTypes from 'prop-types';
import { FormControl } from 'react-bootstrap';
import { connect } from 'react-redux';

const FormControlAdapter = ({ className, type, value, onChange,
  autoFocus, placeholder, autoComplete, componentClass }) => (
    <FormControl
      className={className}
      type={type}
      value={value}
      onChange={onChange}
      autoFocus={autoFocus}
      placeholder={placeholder}
      autoComplete={autoComplete}
      componentClass={componentClass}
    />
);
FormControlAdapter.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  autoFocus: PropTypes.string,
  autoComplete: PropTypes.string,
  placeholder: PropTypes.string.isRequired,
  componentClass: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
};
FormControlAdapter.defaultProps = {
  autoFocus: '',
  autoComplete: '',
};

const mapStateToProps = (state, ownProps) => ({
  className: ownProps.value ? 'hidePlaceholder' : '',
});

export default connect(mapStateToProps)(FormControlAdapter);
