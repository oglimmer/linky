
import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';

import { editLink, clickLink, toggleVisibilityMenuBar } from '../redux/actions';

import UILinkListElement from './UILinkListElement';
import SortButton from './SortButton';
import dateFormat from '../util/DateFormat';
import { DEFAULT_LINK_PROP_TYPES } from '../redux/DataModels';

const getSortingInfo = (sortingByColumn, obj) => {
  if (sortingByColumn === 'mostUsed') {
    return obj.callCounter;
  } else if (sortingByColumn === 'lastUsed') {
    return dateFormat.makeDateHumanreadble(obj.lastCalled);
  } else if (sortingByColumn === 'lastAdded') {
    return dateFormat.makeDateHumanreadble(obj.createdDate);
  }
  return null;
};

const UILinkList = ({ linkList, onUpdateLink, sortingByColumn, onClickLink, feedUpdatesList }) => (
  <ListGroup>
    <ListGroupItem>
      <SortButton byColumn="mostUsed" text="Most used" />{' '}
      <SortButton byColumn="lastUsed" text="Last used" />{' '}
      <SortButton byColumn="lastAdded" text="Last Added" />
    </ListGroupItem>
    { linkList.sort((a, b) => {
      if (sortingByColumn === 'mostUsed') {
        return b.callCounter - a.callCounter;
      } else if (sortingByColumn === 'lastUsed') {
        return new Date(b.lastCalled) - new Date(a.lastCalled);
      } else if (sortingByColumn === 'lastAdded') {
        return new Date(b.createdDate) - new Date(a.createdDate);
      }
      return 0;
    }).map(link => (
      <UILinkListElement
        key={link.id}
        id={link.id}
        linkUrl={`${link.linkUrl} [${getSortingInfo(sortingByColumn, link)}]`}
        pageTitle={`${link.pageTitle}`}
        onUpdateLink={() => onUpdateLink(link.id, link.linkUrl, link.tags.join(' '), link.rssUrl, link.pageTitle, link.notes)}
        onClickLink={onClickLink}
        faviconUrl={link.faviconUrl}
        feedUpdates={feedUpdatesList.find(e => e.id === link.id)}
        hasRssUrl={!!link.rssUrl}
      />),
    )}
  </ListGroup>
);
UILinkList.propTypes = {
  linkList: ImmutablePropTypes.listOf(PropTypes.shape(DEFAULT_LINK_PROP_TYPES)).isRequired,
  feedUpdatesList: ImmutablePropTypes.listOf(PropTypes.shape()).isRequired,
  onUpdateLink: PropTypes.func.isRequired,
  onClickLink: PropTypes.func.isRequired,
  sortingByColumn: PropTypes.string.isRequired,
};


const mapStateToProps = state => ({
  linkList: state.mainData.linkList,
  feedUpdatesList: state.mainData.feedUpdatesList,
  sortingByColumn: state.mainData.sortingByColumn,
});

const mapDispatchToProps = dispatch => ({
  onUpdateLink: (id, url, tags, rssUrl, pageTitle, notes) => {
    dispatch(editLink(id, url, tags, rssUrl, pageTitle, notes));
    dispatch(toggleVisibilityMenuBar(true));
  },
  onClickLink: id => dispatch(clickLink(id)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UILinkList);
