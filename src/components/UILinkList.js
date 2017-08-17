
import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';

import { toggleVisibilityMenuBar } from '../redux/actions';
import { editLink, clickLink } from '../redux/actions/links';

import UILinkListElement from './UILinkListElement';
import SortButton from './SortButton';
import ViewOption from './ViewOption';
import dateFormat from '../util/DateFormat';
import { DEFAULT_LINK_PROP_TYPES } from '../redux/DataModels';

const getSortingInfo = (sortingByColumn, obj) => {
  if (sortingByColumn === 'mostUsed') {
    return obj.callCounter;
  } else if (sortingByColumn === 'lastUsed') {
    return dateFormat.makeDateHumanreadble(obj.lastCalled);
  } else if (sortingByColumn === 'lastAdded') {
    return dateFormat.makeDateHumanreadble(obj.createdDate);
  } else if (sortingByColumn === 'title') {
    return '';
  } else if (sortingByColumn === 'url') {
    return obj.linkUrl;
  }
  return null;
};

const UILinkList = ({ linkList, onUpdateLink, sortingByColumn, sortingByColumnOrder,
  onClickLink, feedUpdatesList }) =>
  (<ListGroup>
    <ListGroupItem>
      Sort by:{' '}
      <SortButton byColumn="mostUsed" text="Most used" />{' '}
      <SortButton byColumn="lastUsed" text="Last used" />{' '}
      <SortButton byColumn="lastAdded" text="Last Added" />{' '}
      <SortButton byColumn="title" text="Title" />{' '}
      <SortButton byColumn="url" text="Url" />{' '}
      View:{' '}
      <ViewOption name="pageTitle" label="Title" />
      <ViewOption name="linkUrl" label="Url" />
      <ViewOption name="notes" label="Notes" />
      <ViewOption name="tags" label="Tags" />
      <ViewOption name="rssUrl" label="RSS" />
    </ListGroupItem>
    { linkList.sort((a, b) => {
      if (sortingByColumn === 'mostUsed') {
        return sortingByColumnOrder * (b.callCounter - a.callCounter);
      } else if (sortingByColumn === 'lastUsed') {
        return sortingByColumnOrder * (new Date(b.lastCalled) - new Date(a.lastCalled));
      } else if (sortingByColumn === 'lastAdded') {
        return sortingByColumnOrder * (new Date(b.createdDate) - new Date(a.createdDate));
      } else if (sortingByColumn === 'title') {
        return sortingByColumnOrder * b.pageTitle.localeCompare(a.pageTitle);
      } else if (sortingByColumn === 'url') {
        return sortingByColumnOrder * b.linkUrl.localeCompare(a.linkUrl);
      }
      return 0;
    }).map(link => (
      <UILinkListElement
        key={link.id}
        id={link.id}
        sortDetails={`[${getSortingInfo(sortingByColumn, link)}]`}
        link={link}
        onUpdateLink={() => onUpdateLink(link.id, link.linkUrl, link.tags.join(' '), link.rssUrl, link.pageTitle, link.notes)}
        onClickLink={onClickLink}
        faviconUrl={link.faviconUrl}
        feedUpdates={feedUpdatesList.find(e => e.id === link.id)}
        hasRssUrl={!!link.rssUrl}
      />),
    )}
  </ListGroup>);
UILinkList.propTypes = {
  linkList: ImmutablePropTypes.listOf(PropTypes.shape(DEFAULT_LINK_PROP_TYPES)).isRequired,
  feedUpdatesList: ImmutablePropTypes.listOf(PropTypes.shape()).isRequired,
  onUpdateLink: PropTypes.func.isRequired,
  onClickLink: PropTypes.func.isRequired,
  sortingByColumn: PropTypes.string.isRequired,
  sortingByColumnOrder: PropTypes.number.isRequired,
};


const mapStateToProps = state => ({
  linkList: state.mainData.linkList,
  feedUpdatesList: state.mainData.feedUpdatesList,
  sortingByColumn: state.mainData.sortingByColumn,
  sortingByColumnOrder: state.mainData.sortingByColumnOrder,
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
