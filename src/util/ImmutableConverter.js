
import Immutable from 'immutable';

const processArray = (varArray) => {
  if (!Array.isArray(varArray)) {
    throw new Error('Assertion failed! element must be Array!');
  }
  const newArray = [];
  varArray.forEach((ele) => {
    /* eslint-disable no-use-before-define */
    if (Array.isArray(ele)) {
      newArray.push(processArray(ele));
    } else {
      newArray.push(processNonArray(ele));
    }
    /* eslint-enable no-use-before-define */
  });
  return Immutable.List(newArray);
};

const processNonArray = (varObject) => {
  if (Array.isArray(varObject)) {
    throw new Error('Assertion failed! Array is not allowed here!');
  }
  if (typeof varObject !== 'object') {
    return varObject;
  }
  const newObj = {};
  Object.keys(varObject).forEach((key) => {
    const element = varObject[key];
    if (Array.isArray(element)) {
      newObj[key] = processArray(element);
    } else {
      newObj[key] = processNonArray(element);
    }
  });
  return newObj;
};

export default (obj) => {
  if (!obj) {
    return obj;
  }
  return processNonArray(JSON.parse(JSON.stringify(obj)));
};
