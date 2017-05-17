
import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';

import { editLink, clickLink } from '../redux/actions';

import ListGroupItemButton from './ListGroupItemButton';
import SortButton from './SortButton';
import dateFormat from '../util/DateFormat';

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

const ListGroupItemList = ({ linkList, onUpdateLink, sortingByColumn, onClickLink }) => (
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
      <ListGroupItemButton
        key={link.id}
        id={link.id}
        linkUrl={`${link.linkUrl} [${getSortingInfo(sortingByColumn, link)}]`}
        onUpdateLink={() => onUpdateLink(link.id, link.linkUrl, link.tags.join(' '))}
        onClickLink={onClickLink}
      />),
    )}
  </ListGroup>
);
ListGroupItemList.propTypes = {
  linkList: ImmutablePropTypes.listOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      linkUrl: PropTypes.string.isRequired,
      callCounter: PropTypes.number.isRequired,
      lastCalled: PropTypes.string.isRequired,
      createdDate: PropTypes.string.isRequired,
      tags: PropTypes.array.isRequired,
    }),
  ).isRequired,
  onUpdateLink: PropTypes.func.isRequired,
  onClickLink: PropTypes.func.isRequired,
  sortingByColumn: PropTypes.string.isRequired,
};


const mapStateToProps = state => ({
  linkList: state.mainData.linkList,
  authToken: state.auth.token,
  sortingByColumn: state.mainData.sortingByColumn,
});

const mapDispatchToProps = dispatch => ({
  onUpdateLink: (id, url, tags) => dispatch(editLink(id, url, tags)),
  onClickLink: id => dispatch(clickLink(id)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ListGroupItemList);
