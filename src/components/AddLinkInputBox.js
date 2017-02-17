
import React, { PropTypes } from 'react';
import { FormGroup, ControlLabel, FormControl, Button } from 'react-bootstrap';
import { connect } from 'react-redux';

import { addLink } from '../redux/actions';

const AddLinkInputBox = ({ dispatch, authToken }) => {
  let input;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!input.value.trim()) {
          return false;
        }
        dispatch(addLink(input.value, authToken));
        input.value = '';
        return true;
      }}
    >
      <FormGroup controlId="linkUrl">
        <ControlLabel>Add a new link</ControlLabel>
        <FormControl
          type="text"
          placeholder="url"
          inputRef={(node) => {
            input = node;
          }}
          autoFocus="true"
          autoComplete="off"
        />
        <FormControl.Feedback />
      </FormGroup>
      <Button
        type="submit"
      >
        Create link
      </Button>
    </form>
  );
};

AddLinkInputBox.propTypes = {
  dispatch: PropTypes.func.isRequired,
  authToken: PropTypes.string.isRequired,
};

const mapStateToPropsAddLinkInputBox = state => ({
  authToken: state.auth.token,
});

export default connect(mapStateToPropsAddLinkInputBox)(AddLinkInputBox);
