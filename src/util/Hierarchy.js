const assert = (expression, error) => {
  if (!expression) {
    throw Error(error);
  }
};

const isIterable = (obj) => {
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
};

const getNodeByName = (obj, tagName) => {
  assert(typeof tagName === 'string', `${tagName} is not a string!`);
  let retNode = null;
  if (obj.children && isIterable(obj.children)) {
    obj.children.forEach((ele) => {
      if (ele.module === tagName) {
        retNode = ele;
      }
      const f = getNodeByName(ele, tagName);
      if (f) {
        retNode = f;
      }
    });
  }
  return retNode;
};

const getParent = (obj, tagName) => {
  assert(typeof tagName === 'string', `${tagName} is not a string!`);
  let retNode = null;
  if (obj.children && isIterable(obj.children)) {
    obj.children.forEach((ele) => {
      if (ele.module === tagName) {
        retNode = obj;
      }
      const f = getParent(ele, tagName);
      if (f) {
        retNode = f;
      }
    });
  }
  return retNode;
};

export const getSiblings = (tagHierarchy, tagName) => {
  const targetNode = getNodeByName(tagHierarchy, tagName);
  if (targetNode) {
    const parent = getParent(tagHierarchy, targetNode.module);
    if (parent) {
      return parent.children;
    }
  }
  return null;
};

export const getChildren = (tagHierarchy, tagName) => {
  const targetNode = getNodeByName(tagHierarchy, tagName);
  if (targetNode) {
    return targetNode.children;
  }
  return null;
};

export default {
  getSiblings,
  getChildren,
};
