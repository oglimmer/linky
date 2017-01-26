
import React, { PropTypes } from 'react';
import { Button, ListGroupItem } from 'react-bootstrap';


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
  id: PropTypes.string.isRequired,
  linkUrl: PropTypes.string.isRequired,
  onDeleteLink: PropTypes.func.isRequired,
};

export default ListGroupItemButton;
