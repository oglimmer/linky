
import React, { PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { Form, actions } from 'react-redux-form';
import { connect } from 'react-redux';

import { addLink } from '../redux/actions';
import FormGroupAdapter from '../components/FormGroupAdapter';

const AddLinkInputBox = ({ onSubmit, authToken, linkId }) => (
  <Form
    model="addUrl"
    onSubmit={formData => onSubmit(formData, authToken, linkId)}
  >
    <FormGroupAdapter
      label="Add a new link"
      model="url" placeholder="url to add (with or without http://)" autoFocus="true" autoComplete="off"
    />
    <FormGroupAdapter
      label="Add some tags"
      model="tags" placeholder="a tag is one word [a-z0-9]" autoComplete="off"
    />
    <Button type="submit">{ linkId === null ? 'Create' : 'Update' } Link</Button>
    { linkId !== null ? <span>{' '}<Button type="button">Del</Button>{' '}<Button type="button">Done</Button></span> : '' }
  </Form>
);
AddLinkInputBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  authToken: PropTypes.string.isRequired,
  linkId: PropTypes.string,
};
AddLinkInputBox.defaultProps = {
  linkId: null,
};

// ----------------------------------------------------------------

const mapStateToPropsAddLinkInputBox = state => ({
  authToken: state.auth.token,
  linkId: state.addUrl.id,
});

const mapDispatchToProps = dispatch => ({
  onSubmit: (formData, authToken, linkId) => {
    if (formData.url.trim()) {
      dispatch(addLink(linkId, formData.url.trim(), formData.tags.trim(), authToken))
        .then(() => dispatch(actions.reset('addUrl.url')))
        .then(() => dispatch(actions.reset('addUrl.tags')))
        .then(() => dispatch(actions.reset('addUrl.id')));
    }
  },
});

export default connect(mapStateToPropsAddLinkInputBox, mapDispatchToProps)(AddLinkInputBox);
