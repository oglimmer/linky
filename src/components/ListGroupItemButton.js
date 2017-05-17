
import React from 'react';
import PropTypes from 'prop-types';
import { Button, ListGroupItem } from 'react-bootstrap';

const ListGroupItemButton = ({ id, linkUrl, onUpdateLink, onClickLink }) => (
  <ListGroupItem onClick={() => onClickLink(id)} href={`/leave?target=${id}`} target="_blank">
    {linkUrl}
    <Button
      className="pull-right btn-xs"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateLink(); }}
    >E</Button>
  </ListGroupItem>
);
ListGroupItemButton.propTypes = {
  id: PropTypes.string.isRequired,
  linkUrl: PropTypes.string.isRequired,
  onUpdateLink: PropTypes.func.isRequired,
  onClickLink: PropTypes.func.isRequired,
};

export default ListGroupItemButton;
