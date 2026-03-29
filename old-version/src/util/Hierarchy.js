
import Immutable from 'immutable';

import { assert } from './Assert';

export const getNodeByName = (tagHierarchy, tagName) => {
  assert(typeof tagName === 'string', `${JSON.stringify(tagName)} is not a string!`);
  return tagHierarchy.find(e => e.name === tagName);
};

export class CachedTagHierarchy {
  constructor(tagHierarchy) {
    this.nodeByName = new Map();
    this.children = new Map();
    this.siblings = new Map();
    this.tagHierarchy = tagHierarchy;
  }

  filterExpressionVisible(node, tagName) {
    // show a node if it has links or it is the selected node
    if (node.count > 0 || node.name === tagName || node.name === 'portal') {
      return true;
    }
    // also show it if it has at least 1 valid child
    const childrenOfSibling = this.getChildren(node.name);
    return childrenOfSibling.size > 0;
  }

  getSiblings(tagName) {
    let nodes = this.siblings.get(tagName);
    if (typeof nodes === 'undefined') {
      const targetNode = this.getNodeByName(tagName);
      if (targetNode) {
        nodes = this.tagHierarchy.filter(e => e.parent === targetNode.parent)
          .filter(child => this.filterExpressionVisible(child, tagName));
      } else {
        nodes = Immutable.List();
      }
      this.siblings.set(tagName, nodes);
    }
    return nodes;
  }

  getChildren(tagName) {
    let nodes = this.children.get(tagName);
    if (typeof nodes === 'undefined') {
      const targetNode = this.getNodeByName(tagName);
      if (targetNode) {
        nodes = this.tagHierarchy.filter(e => e.parent === targetNode.name)
          .filter(sibling => this.filterExpressionVisible(sibling, tagName));
      } else {
        nodes = Immutable.List();
      }
      this.children.set(tagName, nodes);
    }
    return nodes;
  }

  getNodeByName(tagName) {
    let node = this.nodeByName.get(tagName);
    if (typeof node === 'undefined') {
      node = getNodeByName(this.tagHierarchy, tagName);
      this.nodeByName.set(tagName, node);
    }
    return node;
  }
}

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
 *     { name: root, count: .., index: ..., children: [] }
 *   ]
 *   root = [
 *     { name: a, count: .., index: ..., children: [] },
 *     { name: b, count: .., index: ..., children: [] }
 *   ]
 *   b = [
 *     { name: c, count: .., index: ..., children: [] },
 *   ]
 */
const flatToMap = (flatTagHierarchy) => {
  const parentToElementMap = {};
  const elementNameToParentMap = {};
  flatTagHierarchy.forEach((e) => {
    assert(e.name, `element in input array doesn't have name: ${JSON.stringify(e)}`);
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
 *     { name: root , children: [a,b], count: .., index: ... }
 *   ]
 *   root = [
 *     { name: a, children: [], count: .., index: ... },
 *     { name: b, children: [c], count: .., index: ... }
 *   ]
 *   b = [
 *     { name: c, children: [], count: .., index: ... },
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
      children: element.children
        .map(childName => parentToElementMap[element.name].find(e => e.name === childName))
        .sort((a, b) => (a.index < b.index ? -1 : (a.index === b.index ? 0 : 1)))
        .map(ele => conv(ele)),
    };
    /* eslint-enable no-nested-ternary */
    return newElement;
  };
  if (parentToElementMap.$$PARENT_OF_ROOT$$) {
    return conv(parentToElementMap.$$PARENT_OF_ROOT$$[0]);
  }
  return {};
};

/*
 * INPUT: addChildrenToMap
 * OUTPUT:
 * ======
 * {
 *   a: {
 *    contents: {
 *      titleLinkA1: "url-link-a1",
 *      titleLinkA2: "url-link-a2",
 *    }
 *   },
 *   b: {
 *    contents: {
 *      c: {
 *        contents: {
 *          titleLinkC1: "url-link-c1",
 *          titleLinkC2: "url-link-c2",
 *        }
 *      },
 *      titleLinkB1: "url-link-b1",
 *      titleLinkB2: "url-link-b2",
 *      titleLinkB3: "url-link-b3",
 *    }
 *   }
 * }
 */
const mapToNetscapeTree = (parentToElementMap, linklist) => {
  if (!parentToElementMap.$$PARENT_OF_ROOT$$) {
    return {};
  }
  const addChildren = (targetParent, sourceParent) => {
    sourceParent.children
      // childName is the name of child of root
      .map(childName => parentToElementMap[sourceParent.name].find(e => e.name === childName))
      // we now have data objects, not just the names
      // .sort((a, b) => (a.index < b.index ? -1 : (a.index === b.index ? 0 : 1)))
      // don't sort as target is no array anyways
      .forEach((sourceElement) => {
        const tagName = sourceElement.name;
        // each tag is new object
        const newTargetObj = {
          contents: {},
        };
        // copy all child tags into the contents object
        addChildren(newTargetObj.contents, sourceElement);
        let counter = 0;
        linklist.filter(e => e.tags.findIndex(t => t === tagName) !== -1).forEach((link) => {
          let key = link.pageTitle;
          while (newTargetObj.contents[key]) {
            key = `${link.pageTitle}-${counter}`;
            counter += 1;
          }
          newTargetObj.contents[key] = link.linkUrl;
        });
        // assign this new object to parent under tag's name
        const targetParentToAssign = targetParent;
        targetParentToAssign[tagName] = newTargetObj;
      });
  };
  const root = {};
  addChildren(root, parentToElementMap.$$PARENT_OF_ROOT$$[0]);
  return root;
};

export const toHierarchy =
  tagHierarchy => mapToHierarchy(addChildrenToMap(flatToMap(tagHierarchy)));

export const toNetscape = (tagHierarchy, linklist) =>
  mapToNetscapeTree(addChildrenToMap(flatToMap(tagHierarchy)), linklist);

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
