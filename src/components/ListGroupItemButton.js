
const React = require('react');
const { Button, ListGroupItem } = require('react-bootstrap');

const { PropTypes } = React;

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

module.exports = ListGroupItemButton;
