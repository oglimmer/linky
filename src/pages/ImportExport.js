
import React from 'react';
import { connect } from 'react-redux';
import { Button, FormGroup } from 'react-bootstrap';
import { Form } from 'react-redux-form';
import PropTypes from 'prop-types';

import UIInputElement from '../components/UIInputElement';
import { importBookmarks } from '../redux/actions';

const ImportExportPage = ({ onSubmit }) => (
  <div>
    <Form className="form-horizontal" model="importExport" onSubmit={onSubmit}>
      <FormGroup controlId="row1controls">
        <UIInputElement
          label="NETSCAPE-Bookmark-file-1"
          model="bookmarks"
          placeholder="!DOCTYPE NETSCAPE-Bookmark-file-1"
          autoComplete="off"
          componentClass="textarea"
          cols={11}
        />
      </FormGroup>
      <FormGroup controlId="row2controls">
        <UIInputElement
          label="Tag Prefix"
          model="tagPrefix"
          placeholder="Leave blank if you want to import all tags as given or use this
            field to prefix all imported tags"
          autoComplete="off"
          cols={11}
        />
      </FormGroup>
      <FormGroup controlId="row3controls">
        <UIInputElement
          label="Root node for tags"
          model="importNode"
          placeholder="When blank all imported tags go under 'root'. Recommended to use 'import'."
          autoComplete="off"
          cols={11}
        />
      </FormGroup>
      <div>
        <Button type="submit">Import</Button>{' '}
        <Button>Export</Button>
      </div>
    </Form>
  </div>
);
ImportExportPage.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  onSubmit: formData =>
    dispatch(importBookmarks(formData.bookmarks, formData.tagPrefix, formData.importNode)),
});

export default connect(null, mapDispatchToProps)(ImportExportPage);
