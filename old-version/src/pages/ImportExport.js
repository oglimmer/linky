
import React from 'react';
import { connect } from 'react-redux';
import { Button, FormGroup } from 'react-bootstrap';
import { Form } from 'react-redux-form';
import PropTypes from 'prop-types';

import UIInputElement from '../components/UIInputElement';
import { importBookmarks, exportBookmarks } from '../redux/actions';

const ImportExportPage = ({ onSubmit, onExport, buttonsDisable }) => (
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
        <Button disabled={buttonsDisable} type="submit">Import</Button>{' '}
        <Button disabled={buttonsDisable} onClick={onExport}>Export</Button>
      </div>
    </Form>
  </div>
);
ImportExportPage.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  buttonsDisable: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  buttonsDisable: state.importExport.buttonsDisable,
});

const mapDispatchToProps = dispatch => ({
  onSubmit: formData =>
    dispatch(importBookmarks(formData.bookmarks, formData.tagPrefix, formData.importNode)),
  onExport: () => dispatch(exportBookmarks()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportExportPage);
