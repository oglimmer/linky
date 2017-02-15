
// https://react-bootstrap.github.io/components.html#forms

const React = require('react');

const AddLinkInputBox = require('../components/AddLinkInputBox');
const ListGroupItemList = require('../components/ListGroupItemList');

const PortalPage = () => (
  <div>
    <AddLinkInputBox />
    <hr />
    <ListGroupItemList />
  </div>
);

module.exports = PortalPage;
