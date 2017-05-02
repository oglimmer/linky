
import React, { PropTypes } from 'react';
import { Button, ListGroupItem } from 'react-bootstrap';

const ListGroupItemButton = ({ id, linkUrl, onDeleteLink, onClickLink }) => (
  <ListGroupItem onClick={() => onClickLink(id)} href={`/leave?target=${id}`} target="_blank">
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
  onClickLink: PropTypes.func.isRequired,
};

export default ListGroupItemButton;
