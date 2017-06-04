
// https://react-bootstrap.github.io/components.html#forms

import React from 'react';

import AddLinkInputBox from '../components/AddLinkInputBox';
import UILinkList from '../components/UILinkList';
import TagList from '../components/TagList';
import AlertAdapter from '../components/AlertAdapter';

const PortalPage = () => (
  <div>
    <AddLinkInputBox />
    <AlertAdapter />
    <TagList />
    <UILinkList />
  </div>
);

export default PortalPage;
