
import React, { PropTypes } from 'react';
// import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { fetchLinksAndSelectTag } from '../redux/actions';

const divStyle = { marginTop: 9, marginBottom: 9 };

const TagList = ({ tagList, onClick, selectedTag, authToken }) => (
  <div style={divStyle}>
    { tagList.map(tag => (
      <span key={Math.random()}>
        <textbox
          onClick={() => onClick(authToken, tag[0])}
          className={tag[0] === selectedTag ? 'label label-primary' : 'label label-default'}
        >
          {tag[0]} ({tag[1]})
        </textbox>
        {' '}
      </span>),
    ) }
  </div>
);
TagList.propTypes = {
  tagList: ImmutablePropTypes.listOf(PropTypes.array).isRequired,
  onClick: PropTypes.func.isRequired,
  selectedTag: PropTypes.string.isRequired,
  authToken: PropTypes.string.isRequired,
};

// ---------------------------------------------------------------------------------

const mapStateToProps = state => ({
  tagList: state.mainData.tagList,
  selectedTag: state.mainData.selectedTag,
  authToken: state.auth.token,
});

const mapDispatchToProps = dispatch => ({
  onClick: (authToken, tag) => {
    dispatch(fetchLinksAndSelectTag(authToken, tag));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TagList);
