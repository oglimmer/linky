
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { Form } from 'react-redux-form';
import { connect } from 'react-redux';

import { addLink, delLink, reloadTags, checkSelectedTag, resetAddLinkFields } from '../redux/actions';
import FormGroupAdapter from '../components/FormGroupAdapter';

const AddLinkInputBox = ({ onSubmit, authToken, linkId, onClose, onDelete, selectedTag }) => (
  <Form
    model="addUrl"
    onSubmit={formData => onSubmit(formData, authToken, linkId, selectedTag)}
  >
    <FormGroupAdapter
      label="Add a new link"
      model="url"
      placeholder="url to add (with or without http://)"
      autoFocus="true"
      autoComplete="off"
    />
    <FormGroupAdapter
      label="Add some tags"
      model="tags"
      placeholder="a tag is one word [a-z0-9]"
      autoComplete="off"
    />
    <Button type="submit">{ linkId === null ? 'Create' : 'Update' } Link</Button>

    { linkId !== null ?
      <span>
        {' '}
        <Button onClick={() => onDelete(linkId, authToken)} type="button">Del</Button>
        {' '}
        <Button onClick={onClose} type="button">Done</Button>
      </span> : '' }

  </Form>
);
AddLinkInputBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  authToken: PropTypes.string.isRequired,
  linkId: PropTypes.string,
  selectedTag: PropTypes.string.isRequired,
};
AddLinkInputBox.defaultProps = {
  linkId: null,
};

// ----------------------------------------------------------------

const mapStateToPropsAddLinkInputBox = state => ({
  authToken: state.auth.token,
  linkId: state.addUrl.id,
  selectedTag: state.mainData.selectedTag,
});

const mapDispatchToProps = dispatch => ({
  onSubmit: (formData, authToken, linkId, selectedTag) => {
    if (formData.url.trim()) {
      dispatch(addLink(linkId, formData.url.trim(), formData.tags.trim(), authToken, selectedTag))
        .then(() => dispatch(resetAddLinkFields()))
        .then(() => dispatch(reloadTags(authToken)));
    }
  },
  onClose: () => dispatch(resetAddLinkFields()),
  onDelete: (linkId, authToken) => {
    dispatch(delLink(linkId, authToken))
        .then(() => dispatch(resetAddLinkFields()))
        .then(() => dispatch(reloadTags(authToken)))
        .then(() => dispatch(checkSelectedTag()));
  },
});

export default connect(mapStateToPropsAddLinkInputBox, mapDispatchToProps)(AddLinkInputBox);
