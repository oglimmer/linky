
import Immutable from 'immutable';

import { assert } from './Assert';

export const getNodeByName = (tagHierarchy, tagName) => {
  assert(typeof tagName === 'string', `${tagName} is not a string!`);
  return tagHierarchy.find(e => e.name === tagName);
};

export const getChildren = (tagHierarchy, tagName) => {
  const targetNode = getNodeByName(tagHierarchy, tagName);
  if (targetNode) {
    /* eslint-disable no-use-before-define */
    return tagHierarchy.filter(e => e.parent === targetNode.name)
      .filter(child => filterExpressionVisible(child, tagName, tagHierarchy));
    /* eslint-ensable no-use-before-define */
  }
  return Immutable.List();
};

const filterExpressionVisible = (node, tagName, tagHierarchy) => {
  // show a node if it has links or it is the selected node
  if (node.count > 0 || node.name === tagName) {
    return true;
  }
  // also show it if it has at least 1 valid child
  const childrenOfSibling = getChildren(tagHierarchy, node.name);
  return childrenOfSibling.size > 0;
};

export const getSiblings = (tagHierarchy, tagName) => {
  const targetNode = getNodeByName(tagHierarchy, tagName);
  if (targetNode) {
    return tagHierarchy.filter(e => e.parent === targetNode.parent)
      .filter(sibling => filterExpressionVisible(sibling, tagName, tagHierarchy));
  }
  return Immutable.List();
};

export const getParentName = (tagHierarchy, tagName) => getNodeByName(tagName).parent;

export const getParentSiblings = (tagHierarchy, parentName) =>
  getSiblings(tagHierarchy, parentName);


/*
 * INPUT:
 *   PARENT,NAME
 *   ===========
 *   null,root
 *   root,a
 *   root,b
 *   b,c
 *
 * OUTPUT:
 *   elementNameToParentMap:
 *   =======================
 *   c = b
 *   b = root
 *   a = root
 *   root = PARENT_OF_ROOT
 *
 *   parentToElementMap:
 *   ===================
 *   PARENT_OF_ROOT = [
 *     { name: root }
 *   ]
 *   root = [
 *     { name: a },
 *     { name: b }
 *   ]
 *   b = [
 *     { name: c },
 *   ]
 */
const flatToMap = (flatTagHierarchy) => {
  const parentToElementMap = {};
  const elementNameToParentMap = {};
  flatTagHierarchy.forEach((e) => {
    assert(e.name, `element in input array doesn't have name: ${JSON.stringify(e)}`);
    assert(!(e.count == null), `element in input array doesn't have count: ${JSON.stringify(e)}`);
    const parentName = e.parent ? e.parent : '$$PARENT_OF_ROOT$$';
    elementNameToParentMap[e.name] = parentName;
    let valueArray = parentToElementMap[parentName];
    if (!valueArray) {
      valueArray = [];
      parentToElementMap[parentName] = valueArray;
    }
    valueArray.push({
      name: e.name,
      count: e.count,
      index: e.index,
      children: [],
    });
  });
  return { parentToElementMap, elementNameToParentMap };
};

/*
 * INPUT: [parentToElementMap, elementNameToParentMap]
 * OUTPUT:
 * ======
 *   PARENT_OF_ROOT = [
 *     { name: root , children: [a,b] }
 *   ]
 *   root = [
 *     { name: a, children: [] },
 *     { name: b, children: [c] }
 *   ]
 *   b = [
 *     { name: c, children: [] },
 *   ]
 */
const addChildrenToMap = ({ parentToElementMap, elementNameToParentMap }) => {
  Object.keys(elementNameToParentMap).filter(n => n !== 'root').forEach((elementName) => {
    const parentName = elementNameToParentMap[elementName];
    const parentOfParentName = elementNameToParentMap[parentName];
    parentToElementMap[parentOfParentName]
      .find(e => e.name === parentName).children.push(elementName);
  });
  return parentToElementMap;
};

/*
 * INPUT: addChildrenToMap
 * OUTPUT:
 * ======
 * {
 *   hierarchyLevelName: 'root',
 *   count: 0,
 *   collapsed: false,
 *   children: [
 *     {
 *       hierarchyLevelName: 'a',
 *       count: 2,
 *       collapsed: false,
 *       children: [
 *       ]
 *     },
 *     {
 *       hierarchyLevelName: 'b',
 *       count: 3,
 *       collapsed: false,
 *       children: [
 *         {
 *           hierarchyLevelName: 'c',
 *           count: 2,
 *           collapsed: false,
 *           children: [
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
const mapToHierarchy = (parentToElementMap) => {
  const conv = (element) => {
    /* eslint-disable no-nested-ternary */
    const newElement = {
      hierarchyLevelName: element.name,
      count: element.count,
      collapsed: false,
      children: element.children.map((childName) => {
        const childrenData = parentToElementMap[element.name];
        return conv(childrenData.find(e => e.name === childName));
      }).sort((a, b) => (a.index < b.index ? -1 : (a.index === b.index ? 0 : 1))),
    };
    /* eslint-enable no-nested-ternary */
    return newElement;
  };
  return conv(parentToElementMap.$$PARENT_OF_ROOT$$[0]);
};

export const toHierarchy =
  tagHierarchy => mapToHierarchy(addChildrenToMap(flatToMap(tagHierarchy)));

const flattenObj = (obj, parent, index, resultList) => {
  resultList.push({
    name: obj.hierarchyLevelName,
    parent: parent ? parent.hierarchyLevelName : null,
    count: obj.count,
    index,
  });
  let indexCounter = 0;
  obj.children.forEach((child) => {
    flattenObj(child, obj, indexCounter, resultList);
    indexCounter += 1;
  });
};
export const flatten = (hierarchy) => {
  const resultList = [];
  flattenObj(hierarchy, null, 0, resultList);
  return Immutable.List(resultList);
};

export default {
  getNodeByName,
  getParentName,
  getSiblings,
  getChildren,
  toHierarchy,
  flatten,
};
