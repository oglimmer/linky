
// https://react-bootstrap.github.io/components.html#forms

import React from 'react';

import AddLinkInputBox from '../components/AddLinkInputBox';
import ListGroupItemList from '../components/ListGroupItemList';
import TagList from '../components/TagList';

const PortalPage = () => (
  <div>
    <AddLinkInputBox />
    <TagList />
    <ListGroupItemList />
  </div>
);

export default PortalPage;
