
import React, { PropTypes } from 'react';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';

import { delLink, clickLink } from '../redux/actions';

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

const ListGroupItemList = ({ linkList, onDeleteLink, authToken, sortingByColumn, onClickLink }) => (
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
    }).map(link =>
      <ListGroupItemButton
        key={link.id}
        id={link.id}
        linkUrl={`${link.linkUrl} [${getSortingInfo(sortingByColumn, link)}]`}
        onDeleteLink={() => onDeleteLink(link.id, authToken)}
        onClickLink={onClickLink}
      />,
    ) }
  </ListGroup>
);
ListGroupItemList.propTypes = {
  linkList: ImmutablePropTypes.listOf(
    PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      linkUrl: React.PropTypes.string.isRequired,
      callCounter: React.PropTypes.number.isRequired,
    }),
  ).isRequired,
  onDeleteLink: PropTypes.func.isRequired,
  onClickLink: PropTypes.func.isRequired,
  authToken: React.PropTypes.string.isRequired,
  sortingByColumn: React.PropTypes.string.isRequired,
};


const mapStateToProps = state => ({
  linkList: state.mainData.linkList,
  authToken: state.auth.token,
  sortingByColumn: state.mainData.sortingByColumn,
});

const mapDispatchToProps = dispatch => ({
  onDeleteLink: (id, authToken) => dispatch(delLink(id, authToken)),
  onClickLink: id => dispatch(clickLink(id)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ListGroupItemList);
