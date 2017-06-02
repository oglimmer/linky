
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { Form } from 'react-redux-form';
import { connect } from 'react-redux';

import { persistLink, delLink, resetAddLinkFields } from '../redux/actions';
import FormGroupAdapter from '../components/FormGroupAdapter';

const AddLinkInputBox = ({ onSubmit, linkId, onClose, onDelete }) => (
  <Form
    model="addUrl"
    onSubmit={formData => onSubmit(formData, linkId)}
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
    <FormGroupAdapter
      label="Add a RSS url if available"
      model="rssUrl"
      placeholder="url to RSS feed for this page"
      autoComplete="off"
    />
    <FormGroupAdapter
      label="Page Title"
      model="pageTitle"
      placeholder="the page title (leave blank to fill automatically)"
      autoComplete="off"
    />
    <FormGroupAdapter
      label="Notes"
      model="notes"
      placeholder="Just some notes"
      autoComplete="off"
    />
    <Button type="submit">{ linkId === null ? 'Create' : 'Update' } Link</Button>

    { linkId !== null ?
      <span>
        {' '}
        <Button
          onClick={() => onDelete(linkId)}
          type="button"
        >
          Del
        </Button>
        {' '}
        <Button onClick={onClose} type="button">Done</Button>
      </span> : '' }

  </Form>
);
AddLinkInputBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  linkId: PropTypes.string,
};
AddLinkInputBox.defaultProps = {
  linkId: null,
};

// ----------------------------------------------------------------

const mapStateToPropsAddLinkInputBox = state => ({
  linkId: state.addUrl.id,
});


const mapDispatchToProps = dispatch => ({
  onSubmit: (formData, linkId) => {
    if (formData.url.trim()) {
      console.log(formData);
      dispatch(
        persistLink(linkId, formData.url.trim(), formData.tags.trim(),
          formData.rssUrl.trim(), formData.pageTitle.trim(), formData.notes.trim()));
      dispatch(resetAddLinkFields());
    }
  },
  onClose: () => dispatch(resetAddLinkFields()),
  onDelete: (linkId) => {
    dispatch(delLink(linkId));
    dispatch(resetAddLinkFields());
  },
});

export default connect(mapStateToPropsAddLinkInputBox, mapDispatchToProps)(AddLinkInputBox);
