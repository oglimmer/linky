
// https://react-bootstrap.github.io/components.html#forms

import React, { PropTypes } from 'react';
import { FormGroup, ControlLabel, FormControl, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import { connect } from 'react-redux';

import { delLink, addLink } from '../redux/actions';

const ListGroupItemButton = ({ id, linkUrl, onDeleteLink }) => (
  <ListGroupItem href={linkUrl}>
    {linkUrl}
    <Button
      className="pull-right btn-xs"
      onClick={(e) => { e.preventDefault(); onDeleteLink(id); }}
    >X</Button>
  </ListGroupItem>
);
ListGroupItemButton.propTypes = {
  id: React.PropTypes.string.isRequired,
  linkUrl: React.PropTypes.string.isRequired,
  onDeleteLink: React.PropTypes.func.isRequired,
};

const ListGroupItemList = ({ linkList, onDeleteLink }) => (
  <ListGroup>
    { linkList.map(link =>
      <ListGroupItemButton
        key={link.id}
        id={link.id}
        linkUrl={link.linkUrl}
        onDeleteLink={() => onDeleteLink(link.id)}
      />
    ) }
  </ListGroup>
);
/* eslint-disable react/no-unused-prop-types */
ListGroupItemList.propTypes = {
  linkList: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    linkUrl: PropTypes.string.isRequired,
  }).isRequired).isRequired,
  onDeleteLink: PropTypes.func.isRequired,
};
/* eslint-enable react/no-unused-prop-types */


const mapStateToProps = state => ({
  linkList: state.mainData.linkList,
});

const mapDispatchToProps = dispatch => ({
  onDeleteLink: (id) => {
    dispatch(delLink(id));
  },
});

const VisibleListGroupItemList = connect(
  mapStateToProps,
  mapDispatchToProps
)(ListGroupItemList);

let AddLinkInputBox = ({ dispatch }) => {
  let input;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!input.value.trim()) {
          return false;
        }
        dispatch(addLink(input.value));
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
  dispatch: React.PropTypes.func.isRequired,
};
AddLinkInputBox = connect()(AddLinkInputBox);

const PortalPage = () => (
  <div>
    <AddLinkInputBox />
    <hr />
    <VisibleListGroupItemList />
  </div>
);

PortalPage.propTypes = {
};

export default PortalPage;
