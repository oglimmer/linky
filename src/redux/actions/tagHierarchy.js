
import fetch from '../../util/fetch';

import { MANIPULATE_TAG, RENAME_TAG_HIERARCHY, SET_TAG_HIERARCHY,
  SELECT_NODE, REMOVE_TAG_HIERARCHY, ADD_TAG_HIERARCHY,
  UPDATE_COUNT_IN_HIERARCHY } from '../actionTypes';

import { setInfoMessage, setErrorMessage, setTempMessage } from './feedback';

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

function updateCountInHierarchy(tagName, count) {
  return { type: UPDATE_COUNT_IN_HIERARCHY, tagName, count };
}

export function fetchTagHierarchy() {
  return async (dispatch, getState) => {
    try {
      const tagHierarchy = await fetch.get('/rest/tags/hierarchy', getState().auth.token);
      dispatch(setTagHierarchy(tagHierarchy));
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}


export function initialLoadTags() {
  return (dispatch, getState) => {
    if (!getState().tagHierarchyData.tagHierarchy) {
      return dispatch(fetchTagHierarchy());
    }
    return Promise.resolve();
  };
}

/*
 * two arrays are equal if each element on pos x equals in name and parent on pos x on the other
 * (index and count are of interest, as index is represented by the pos and count isn't saved in
 * the tagHierarchy)
 */
const equalArray = (a1, a2) => {
  const a1Size = a1.size ? a1.size : a1.length;
  const a2Size = a2.size ? a2.size : a2.length;
  if (a1Size !== a2Size) {
    return false;
  }
  return a1.every((elementA1, index) => {
    const elementA2 = a2.get ? a2.get(index) : a2[index];
    if (!elementA2) {
      return false;
    }
    return elementA1.name === elementA2.name && elementA1.parent === elementA2.parent;
  });
};

export function saveTagHierarchy(tree, alwaysSendToServer = false) {
  return async (dispatch, getState) => {
    const oldTree = getState().tagHierarchyData.tagHierarchy;
    if (alwaysSendToServer || !equalArray(oldTree, tree)) {
      dispatch(setTempMessage('sending data to server ...'));
      try {
        await fetch.put('/rest/tags/hierarchy', { tree }, getState().auth.token);
        dispatch(setTagHierarchy(tree));
        dispatch(setInfoMessage('Tag hierarchy successfully saved.'));
      } catch (err) {
        dispatch(setErrorMessage(err));
      }
    }
    return Promise.resolve();
  };
}

function persistRemoveTag(tagName) {
  return async (dispatch, getState) => {
    try {
      await fetch.delete(`/rest/tags/${tagName}`, getState().auth.token);
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}

export function removeTagHierarchyNode() {
  return async (dispatch, getState) => {
    const { selectedNode } = getState().tagHierarchyData;
    const promises = [];
    let tagName;
    if (selectedNode) {
      dispatch(setTempMessage('sending data to server ...'));
      tagName = selectedNode.hierarchyLevelName;
      promises.push(Promise.resolve(dispatch({ type: REMOVE_TAG_HIERARCHY, tagName })));
      promises.push(dispatch(persistRemoveTag(tagName)));
      if (selectedNode.count > 0) {
        promises.push(dispatch(removeTagFromLinks(tagName)));
      }
      if (selectedNode.hierarchyLevelName === getState().mainData.selectedTag) {
        promises.push(dispatch(selectTag('portal')));
      }
    }
    await Promise.all(promises);
    if (tagName) {
      dispatch(setInfoMessage(`Tag ${tagName} successfully deleted.`));
    }
  };
}

export function addTagHierarchyNode() {
  /* eslint-disable no-alert */
  const name = prompt('Enter the node`s name ([a-z0-9-])');
  /* eslint-enable no-alert */
  const simpleWordRegex = new RegExp('^[a-z0-9-]*$');
  const split = name.toLowerCase().split(' ').filter(e => simpleWordRegex.test(e));
  const tagName = split[0];
  if (tagName) {
    return async (dispatch, getState) => {
      dispatch(setTempMessage('sending data to server ...'));
      await Promise.resolve(dispatch({ type: ADD_TAG_HIERARCHY, name: tagName }));
      await saveTagHierarchy(getState().tagHierarchyData.tagHierarchy, true);
      dispatch(setInfoMessage(`Tag ${tagName} successfully added.`));
    };
  }
  return () => {
    // noop
  };
}

function saveChangedLinklist(oldTagName, newTagName) {
  return async (dispatch, getState) => {
    try {
      const response = await fetch.patch('/rest/links/tags', {
        oldTagName,
        newTagName,
      }, getState().auth.token);
      const jsonResponse = await response.json();
      dispatch(updateCountInHierarchy(newTagName, jsonResponse.count));
    } catch (err) {
      dispatch(setErrorMessage(err));
    }
  };
}

// rename or merge
export function renameTagHierarchyNode(nodeName) {
  /* eslint-disable no-alert */
  const name = prompt('Enter the new/existing node`s name ([a-z0-9-])', nodeName);
  /* eslint-enable no-alert */
  const simpleWordRegex = new RegExp('^[a-z0-9-]*$');
  const split = name.toLowerCase().split(' ').filter(e => simpleWordRegex.test(e));
  const newTagName = split[0];
  if (newTagName) {
    return async (dispatch) => {
      dispatch(setTempMessage('sending data to server ...'));
      await Promise.resolve(dispatch(selectTag(null)));
      await Promise.all([
        dispatch(renameTagInLinks(nodeName, newTagName)),
        Promise.resolve(dispatch(renameTagHierarchy(nodeName, newTagName))),
        dispatch(saveChangedLinklist(nodeName, newTagName)),
      ]);
      dispatch(setInfoMessage(`Tag successfully renamed to ${newTagName}.`));
    };
  }
  return () => {
    // nop
  };
}
