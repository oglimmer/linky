
import React, { PropTypes } from 'react';
import { ListGroup } from 'react-bootstrap';
import { connect } from 'react-redux';

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
/* eslint-disable react/no-unused-prop-types */
ListGroupItemList.propTypes = {
  linkList: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    linkUrl: PropTypes.string.isRequired,
  }).isRequired).isRequired,
  onDeleteLink: PropTypes.func.isRequired,
  authToken: React.PropTypes.string.isRequired,
};
/* eslint-enable react/no-unused-prop-types */


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
