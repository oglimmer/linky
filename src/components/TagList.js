
import React from 'react';
import PropTypes from 'prop-types';
// import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { changeTag } from '../redux/actions';

const divStyle = { marginTop: 9, marginBottom: 9 };

const TagList = ({ tagList, onClick, selectedTag }) => (
  <div style={divStyle}>
    { tagList.map(tag => (
      <span key={Math.random()}>
        <span
          role="link"
          tabIndex="0"
          onClick={() => onClick(tag[0])}
          className={tag[0] === selectedTag ? 'label label-primary' : 'label label-default'}
        >
          {tag[0]} ({tag[1]})
        </span>
        {' '}
      </span>),
    ) }
  </div>
);
TagList.propTypes = {
  tagList: ImmutablePropTypes.listOf(PropTypes.array).isRequired,
  onClick: PropTypes.func.isRequired,
  selectedTag: PropTypes.string.isRequired,
};

// ---------------------------------------------------------------------------------

const mapStateToProps = state => ({
  tagList: state.mainData.tagList,
  selectedTag: state.mainData.selectedTag,
  authToken: state.auth.token,
});

const mapDispatchToProps = dispatch => ({
  onClick: tag => dispatch(changeTag(tag)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TagList);
