

export default {
};

// export const diff = (a, b) => a.filter(eOfA => b.findIndex(eOfB => eOfA[0] === eOfB[0]) === -1);

export const diff = (a, b) => a.filter(e => b.indexOf(e) === -1);

