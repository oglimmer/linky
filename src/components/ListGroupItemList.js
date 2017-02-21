
import React, { PropTypes } from 'react';
import { ListGroup } from 'react-bootstrap';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';

import { delLink } from '../redux/actions';

import ListGroupItemButton from './ListGroupItemButton';

const ListGroupItemList = ({ linkList, onDeleteLink, authToken }) => (
  <ListGroup>
    { linkList.map(link =>
      <ListGroupItemButton
        key={link.id}
        id={link.id}
        linkUrl={link.linkUrl}
        onDeleteLink={() => onDeleteLink(link.id, authToken)}
      />,
    ) }
  </ListGroup>
);
ListGroupItemList.propTypes = {
  linkList: ImmutablePropTypes.listOf(
    PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      linkUrl: React.PropTypes.string.isRequired,
    }),
  ).isRequired,
  onDeleteLink: PropTypes.func.isRequired,
  authToken: React.PropTypes.string.isRequired,
};


const mapStateToProps = state => ({
  linkList: state.mainData.linkList,
  authToken: state.auth.token,
});

const mapDispatchToProps = dispatch => ({
  onDeleteLink: (id, authToken) => {
    dispatch(delLink(id, authToken));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ListGroupItemList);
