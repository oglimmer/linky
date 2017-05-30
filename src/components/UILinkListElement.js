
import React from 'react';
import PropTypes from 'prop-types';
import { Button, ListGroupItem } from 'react-bootstrap';

const UILinkListElement = ({ id, linkUrl, onUpdateLink, onClickLink, faviconUrl }) => (
  <ListGroupItem onClick={() => onClickLink(id)} href={`/leave?target=${id}`} target="_blank">
    <img width="16" src={faviconUrl || '/images/default.png'} alt="favicon" />
    {' '}
    {linkUrl}
    <Button
      className="pull-right btn-xs"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateLink(); }}
    >E</Button>
  </ListGroupItem>
);
UILinkListElement.propTypes = {
  id: PropTypes.string.isRequired,
  linkUrl: PropTypes.string.isRequired,
  onUpdateLink: PropTypes.func.isRequired,
  onClickLink: PropTypes.func.isRequired,
  faviconUrl: PropTypes.string,
};
UILinkListElement.defaultProps = {
  faviconUrl: null,
};

export default UILinkListElement;
