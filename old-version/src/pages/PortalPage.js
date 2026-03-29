
// https://react-bootstrap.github.io/components.html#forms

import React from 'react';

import AddLinkInputBox from '../components/AddLinkInputBox';
import UILinkList from '../components/UILinkList';
import TagList from '../components/TagList';
import ToggleAddLinkMenuButton from '../components/ToggleAddLinkMenuButton';

const PortalPage = () => (
  <div>
    <ToggleAddLinkMenuButton />
    <AddLinkInputBox />
    <TagList />
    <UILinkList />
  </div>
);

export default PortalPage;
