
let data = {};

export default {

  wasCalled: key => data[key],

  setCalled: (key) => {
    data[key] = true;
  },

  clear: () => {
    data = {};
  },

};

