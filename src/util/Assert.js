

export const assert = (expression, error) => {
  if (!expression) {
    throw Error(error);
  }
};

export default {
  assert,
};
