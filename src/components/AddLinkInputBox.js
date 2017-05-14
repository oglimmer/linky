
import React, { PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { Form, actions } from 'react-redux-form';
import { connect } from 'react-redux';

import { addLink } from '../redux/actions';
import FormGroupAdapter from '../components/FormGroupAdapter';

const AddLinkInputBox = ({ onSubmit, authToken }) => (
  <Form
    model="addUrl"
    onSubmit={formData => onSubmit(formData, authToken)}
  >
    <FormGroupAdapter
      label="Add a new link"
      model="url" placeholder="url to add (with or without http://)" autoFocus="true" autoComplete="off"
    />
    <FormGroupAdapter
      label="Add some tags"
      model="tags" placeholder="a tag is one word [a-z0-9]" autoComplete="off"
    />
    <Button type="submit">Create Link</Button>
  </Form>
);
AddLinkInputBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  authToken: PropTypes.string.isRequired,
};

// ----------------------------------------------------------------

const mapStateToPropsAddLinkInputBox = state => ({
  authToken: state.auth.token,
});

const mapDispatchToProps = dispatch => ({
  onSubmit: (formData, authToken) => {
    if (formData.url.trim()) {
      dispatch(addLink(formData.url.trim(), formData.tags.trim(), authToken))
        .then(() => dispatch(actions.reset('addUrl.url')))
        .then(() => dispatch(actions.reset('addUrl.tags')));
    }
  },
});

export default connect(mapStateToPropsAddLinkInputBox, mapDispatchToProps)(AddLinkInputBox);
