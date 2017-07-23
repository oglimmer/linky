
import React from 'react';
import PropTypes from 'prop-types';
import { Button, FormGroup } from 'react-bootstrap';
import { Form } from 'react-redux-form';
import { connect } from 'react-redux';

import { toggleVisibilityMenuBar } from '../redux/actions';
import { persistLink, delLink, resetAddLinkFields } from '../redux/actions/links';
import UIInputElement from '../components/UIInputElement';

const AddLinkInputBox = ({ onSubmit, linkId, onClose, onDelete, isAddEnabled }) => {
  if (!isAddEnabled) {
    return null;
  }
  return (
    <Form
      className="form-horizontal"
      model="addUrl"
      onSubmit={formData => onSubmit(formData, linkId)}
    >
      <FormGroup controlId="row1controls">
        <UIInputElement
          label="Url"
          model="url"
          placeholder="url to add (with or without http://)"
          autoFocus="true"
          autoComplete="off"
        />
        <UIInputElement
          label="Tags"
          model="tags"
          placeholder="a tag is one word [a-z0-9]"
          autoComplete="off"
        />
      </FormGroup>
      <FormGroup controlId="row2controls">
        <UIInputElement
          label="Feed Url"
          model="rssUrl"
          placeholder="url to RSS feed for this page"
          autoComplete="off"
        />
        <UIInputElement
          label="Title"
          model="pageTitle"
          placeholder="the page title (leave blank to fill automatically)"
          autoComplete="off"
        />
      </FormGroup>
      <FormGroup controlId="row3controls">
        <UIInputElement
          label="Notes"
          model="notes"
          placeholder="Just some notes"
          autoComplete="off"
          componentClass="textarea"
          cols={11}
        />
      </FormGroup>
      <div>
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
          </span> : '' }
        {' '}
        <Button onClick={onClose} type="button">Cancel</Button>
      </div>

    </Form>
  );
};
AddLinkInputBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  linkId: PropTypes.string,
  isAddEnabled: PropTypes.bool.isRequired,
};
AddLinkInputBox.defaultProps = {
  linkId: null,
};

// ----------------------------------------------------------------

const mapStateToPropsAddLinkInputBox = state => ({
  linkId: state.addUrl.id,
  isAddEnabled: state.menuBar.addEnabled,
});


const mapDispatchToProps = dispatch => ({
  onSubmit: (formData, linkId) => {
    if (formData.url.trim()) {
      dispatch(
        persistLink(linkId, formData.url.trim(), formData.tags.trim(),
          formData.rssUrl.trim(), formData.pageTitle.trim(), formData.notes.trim()));
      dispatch(resetAddLinkFields());
      dispatch(toggleVisibilityMenuBar());
    }
  },
  onClose: () => {
    dispatch(toggleVisibilityMenuBar());
    dispatch(resetAddLinkFields());
  },
  onDelete: (linkId) => {
    dispatch(delLink(linkId));
    dispatch(resetAddLinkFields());
    dispatch(toggleVisibilityMenuBar());
  },
});

export default connect(mapStateToPropsAddLinkInputBox, mapDispatchToProps)(AddLinkInputBox);
