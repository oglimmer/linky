
import React from 'react';
import PropTypes from 'prop-types';
import { ControlLabel, Col } from 'react-bootstrap';
import { actions } from 'react-redux-form';
import { connect } from 'react-redux';
import ReactTags from 'react-tag-autocomplete';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Immutable from 'immutable';


const UIInputAutocompleteElmenet = ({ tags, suggestions, addTag, delTag }) => (
  <span>
    <Col componentClass={ControlLabel} sm={1}>Tags</Col>
    <Col sm={5}>
      <ReactTags
        tags={tags.toArray()}
        suggestions={suggestions.toArray()}
        handleDelete={ele => delTag(ele, tags)}
        handleAddition={ele => addTag(ele, tags)}
        allowNew={!false}
        placeholder="[a-z0-9-]"
        autofocus={false}
      />
    </Col>
  </span>
);
UIInputAutocompleteElmenet.propTypes = {
  addTag: PropTypes.func.isRequired,
  delTag: PropTypes.func.isRequired,
  tags: ImmutablePropTypes.listOf(PropTypes.shape()).isRequired,
  suggestions: ImmutablePropTypes.listOf(PropTypes.shape()).isRequired,
};

const mapStateToProps = state => ({
  tags: Immutable.List(
    state.addUrl.tags ? state.addUrl.tags.split(' ').map(e => ({ id: e, name: e })) : [],
  ),
  suggestions: state.tagHierarchyData.tagHierarchy
    .map(e => ({ id: e.name, name: e.name }))
    .filter(e => !state.addUrl.tags.split(' ').find(existingTags => existingTags === e.name)),
});


const mapDispatchToProps = dispatch => ({
  addTag: (elementToAdd, tags) => {
    if (!tags.find(tag => elementToAdd.name === tag.name)) {
      const existingTags = tags.map(t => t.name).join(' ');
      const newTag = elementToAdd.name;
      const completeNewTags = `${existingTags} ${newTag}`.trim();
      dispatch(actions.change('addUrl.tags', completeNewTags));
    }
  },
  delTag: (indexToDel, tags) => {
    const newTags = tags.filter((tag, index) => indexToDel !== index).map(t => t.name);
    dispatch(actions.change('addUrl.tags', newTags.join(' ')));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(UIInputAutocompleteElmenet);
