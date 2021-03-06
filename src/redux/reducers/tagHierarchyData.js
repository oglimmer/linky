
import Immutable from 'immutable';

import { MANIPULATE_TAG, ADD_TAG_HIERARCHY, RENAME_TAG_HIERARCHY,
  SET_TAG_HIERARCHY, SELECT_NODE, REMOVE_TAG_HIERARCHY, RESET,
  UPDATE_COUNT_IN_HIERARCHY, BEGIN_DRAG, END_DRAG } from './../actionTypes';

import { initialStateTagData } from './../DataModels';

import immutableConverter from '../../util/ImmutableConverter';
import { getNodeByName } from '../../util/Hierarchy';

import { assert } from '../../util/Assert';

/* eslint-disable no-nested-ternary */
const getNextIndex = (state, parentTagName = 'root') => {
  const sortedRootElements = state.tagHierarchy
    .filter(e => e.parent === parentTagName)
    .sort((a, b) => (a.index < b.index ? 1 : (a.index === b.index ? 0 : -1)));
  if (sortedRootElements.size > 0) {
    return sortedRootElements.get(0).index + 1;
  }
  return 0;
};
/* eslint-enable no-nested-ternary */

const addTagStateUpdate = (state, newTagName, initialCount) => {
  if (state.tagHierarchy.findIndex(e => e.name === newTagName) !== -1) {
    return state.tagHierarchy;
  }
  return state.tagHierarchy.push({
    name: newTagName,
    count: initialCount,
    parent: 'root',
    index: getNextIndex(state),
  });
};

const manipulateTagStateUpdate = (state, action) => {
  const tagName = action.tagName;
  if (action.val < 0) {
    assert(getNodeByName(state.tagHierarchy, tagName).count > 0, `Count of ${tagName} was 0`);
  }
  const index = state.tagHierarchy.findIndex(ele => ele.name === tagName);
  if (index === -1) {
    return addTagStateUpdate(state, tagName, action.val);
  }
  return state.tagHierarchy.update(
    index,
    val => Object.assign({}, val, {
      count: val.count + action.val,
    }),
  );
};

const removeTagHierarchyUpdateState = (state, action) =>
  state.tagHierarchy.filter(ele => ele.name !== action.tagName);

const renameTagHierarchyUpdateState = (state, oldName, newName) => {
  const tagHierarchy = state.tagHierarchy.toArray();
  const indexTarget = tagHierarchy.findIndex(e => e.name === newName);
  const indexOld = tagHierarchy.findIndex(e => e.name === oldName);
  if (indexTarget === -1) {
    // rename
    tagHierarchy[indexOld].name = newName;
  } else {
    // merge
    tagHierarchy.splice(indexOld, 1);
  }
  tagHierarchy.forEach((ele) => {
    const elementToUpdate = ele;
    if (ele.parent === oldName) {
      elementToUpdate.parent = newName;
    }
  });
  return Immutable.List(tagHierarchy);
};

const updateObjectEndDrag = (state, action) => {
  if (!action.target) {
    return {
      dragInProgress: null,
    };
  }
  const { parentNode, next, prev } = action.target;
  const tagName = state.dragInProgress;
  let index;
  let reindex = false;
  if (!next && !prev) {
    // add to empty list
    index = 0;
  } else if (!next) {
    // last child in a list
    index = getNextIndex(state, parentNode.hierarchyLevelName);
  } else {
    // any child other than last
    index = state.tagHierarchy.find(e => e.name === next).index - 0.1;
    reindex = true;
  }
  let tagHierarchy = state.tagHierarchy.update(
    state.tagHierarchy.findIndex(ele => ele.name === tagName),
    val => Object.assign({}, val, {
      parent: parentNode.hierarchyLevelName,
      index,
    }),
  );
  if (reindex) {
    tagHierarchy = tagHierarchy.withMutations((list) => {
      /* eslint-disable no-nested-ternary */
      list
        .filter(e => e.parent === parentNode.hierarchyLevelName)
        .sort((a, b) => (a.index < b.index ? -1 : (a.index === b.index ? 0 : 1)))
        .forEach((e, localIndex) => { e.index = localIndex; });
      return list;
      /* eslint-enable no-nested-ternary */
    });
  }
  return {
    dragInProgress: null,
    tagHierarchy,
  };
};

export default function tagHierarchyData(state = initialStateTagData, action) {
  switch (action.type) {
    case RESET:
      return initialStateTagData;
    case SET_TAG_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: immutableConverter(action.tagHierarchy),
      });
    case SELECT_NODE:
      return Object.assign({}, state, {
        selectedNode: action.node,
      });
    case MANIPULATE_TAG:
      return Object.assign({}, state, {
        tagHierarchy: manipulateTagStateUpdate(state, action),
      });
    case ADD_TAG_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: addTagStateUpdate(state, action.name, 0),
      });
    case REMOVE_TAG_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: removeTagHierarchyUpdateState(state, action),
      });
    case RENAME_TAG_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: renameTagHierarchyUpdateState(state, action.oldTagName, action.newTagName),
      });
    case UPDATE_COUNT_IN_HIERARCHY:
      return Object.assign({}, state, {
        tagHierarchy: state.tagHierarchy.update(
          state.tagHierarchy.findIndex(ele => ele.name === action.tagName),
          val => Object.assign({}, val, {
            count: action.count,
          }),
        ),
      });
    case BEGIN_DRAG:
      return Object.assign({}, state, {
        dragInProgress: action.tag,
      });
    case END_DRAG:
      return Object.assign({}, state, updateObjectEndDrag(state, action));
    default:
      return state;
  }
}
