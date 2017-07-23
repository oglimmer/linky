
import fetch from '../../util/fetch';

import { MANIPULATE_TAG, RENAME_TAG_HIERARCHY, SET_TAG_HIERARCHY,
  SELECT_NODE, REMOVE_TAG_HIERARCHY, ADD_TAG_HIERARCHY } from '../actionTypes';

import { selectTag, renameTagInLinks, removeTagFromLinks } from './links';

export function manipulateTagCounter(tagName, val) {
  return { type: MANIPULATE_TAG, tagName, val };
}

function renameTagHierarchy(oldTagName, newTagName) {
  return { type: RENAME_TAG_HIERARCHY, oldTagName, newTagName };
}

function setTagHierarchy(tagHierarchy) {
  return { type: SET_TAG_HIERARCHY, tagHierarchy };
}

export function selectNodeInTagHierarchy(node) {
  return { type: SELECT_NODE, node };
}

export function fetchTagHierarchy() {
  return (dispatch, getState) => fetch.get('/rest/tags/hierarchy', getState().auth.token)
    .then(response => response.json())
    .then(tagHierarchy => dispatch(setTagHierarchy(tagHierarchy)));
}


export function initialLoadTags() {
  return (dispatch, getState) => {
    if (!getState().tagHierarchyData.tagHierarchy) {
      return dispatch(fetchTagHierarchy());
    }
    return Promise.resolve();
  };
}

export function saveTagHierarchy(tree) {
  return (dispatch, getState) => fetch.put('/rest/tags/hierarchy', { tree }, getState().auth.token)
    .then(response => response.json())
    .then(() => dispatch(setTagHierarchy(tree)))
    .catch(error => console.log(error));
}

function persistRemoveTag(tagName) {
  return (dispatch, getState) => fetch.delete(`/rest/tags/${tagName}`, getState().auth.token)
    .catch(error => console.log(error));
}

export function removeTagHierarchyNode() {
  return (dispatch, getState) => {
    const { selectedNode } = getState().tagHierarchyData;
    const promises = [];
    if (selectedNode) {
      const tagName = selectedNode.hierarchyLevelName;
      promises.push(Promise.resolve(dispatch({ type: REMOVE_TAG_HIERARCHY, tagName })));
      promises.push(dispatch(persistRemoveTag(tagName)));
      if (selectedNode.count > 0) {
        promises.push(dispatch(removeTagFromLinks(tagName)));
      }
    }
    return Promise.all(promises);
  };
}

export function addTagHierarchyNode() {
  /* eslint-disable no-alert */
  const name = prompt('Enter the node`s name ([a-z0-9])');
  /* eslint-enable no-alert */
  const simpleWordRegex = new RegExp('^[a-z0-9]*$');
  const split = name.toLowerCase().split(' ').filter(e => simpleWordRegex.test(e));
  if (split[0]) {
    return (dispatch, getState) =>
      Promise.resolve(dispatch({ type: ADD_TAG_HIERARCHY, name: split[0] }))
      .then(() => dispatch(saveTagHierarchy(getState().tagHierarchyData.tagHierarchy)));
  }
  return () => {
    // nop
  };
}

export function saveChangedLinklist(oldTagName, newTagName) {
  return (dispatch, getState) => fetch.patch('/rest/links/tags', { oldTagName, newTagName }, getState().auth.token)
      .catch(error => console.log(error));
}

export function renameTagHierarchyNode(nodeName) {
  /* eslint-disable no-alert */
  const name = prompt('Enter the new node`s name ([a-z0-9])', nodeName);
  /* eslint-enable no-alert */
  const simpleWordRegex = new RegExp('^[a-z0-9]*$');
  const split = name.toLowerCase().split(' ').filter(e => simpleWordRegex.test(e));
  const newTagName = split[0];
  if (newTagName) {
    return (dispatch, getState) => Promise.resolve(dispatch(selectTag(null)))
      .then(() => Promise.all([
        dispatch(renameTagInLinks(nodeName, newTagName)),
        dispatch(saveChangedLinklist(nodeName, newTagName)),
        Promise.resolve(dispatch(renameTagHierarchy(nodeName, newTagName)))
          .then(() => dispatch(saveTagHierarchy(getState().tagHierarchyData.tagHierarchy))),
      ]));
  }
  return () => {
    // nop
  };
}
