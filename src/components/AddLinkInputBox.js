
import React, { PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { Form, actions } from 'react-redux-form';
import { connect } from 'react-redux';

import { addLink } from '../redux/actions';
import FormGroupAdapter from '../components/FormGroupAdapter';

const AddLinkInputBox = ({ dispatch, authToken }) => (
  <Form
    model="addUrl"
    onSubmit={(formData) => {
      if (formData.url.trim()) {
        dispatch(addLink(formData.url, authToken)).then(() => dispatch(actions.reset('addUrl.url')));
      }
    }}
  >
    <FormGroupAdapter
      label="Add a new link"
      model="url" placeholder="url to add (with or without http://)" autoFocus="true" autoComplete="off"
    />
    <Button type="submit">Create Link</Button>
  </Form>
);
AddLinkInputBox.propTypes = {
  dispatch: PropTypes.func.isRequired,
  authToken: PropTypes.string.isRequired,
};

const mapStateToPropsAddLinkInputBox = state => ({
  authToken: state.auth.token,
});

export default connect(mapStateToPropsAddLinkInputBox)(AddLinkInputBox);
