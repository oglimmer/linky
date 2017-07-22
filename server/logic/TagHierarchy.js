
import tagDao from '../dao/tagDao';

const getCountForNode = (allTags, nodeName) => {
  const matchingEle = allTags.find(e => e[0] === nodeName);
  if (matchingEle) {
    return matchingEle[1];
  }
  return 0;
};

const init = (allTags, parent = 'root') => {
  if (!allTags.find(e => e[0].toLowerCase() === 'portal')) {
    allTags.push(['portal', 0]);
  }
  const tagHierarchy = allTags.map((e, index) => ({
    name: e[0],
    parent,
    index,
  }));
  tagHierarchy.push({
    name: 'root',
    parent: null,
    index: 0,
  });
  if (parent !== 'root') {
    tagHierarchy.push({
      name: parent,
      parent: 'root',
      index: 0,
    });
  }
  return tagHierarchy;
};

const loadResponseData = userid => Promise.all([
  tagDao.listAllTags(userid),
  tagDao.getHierarchyByUser(userid),
]).then(([allTags, rec]) => {
  const data = rec ? rec.tree : init(allTags);
  return data.map(node => ({
    name: node.name,
    parent: node.parent,
    index: node.index,
    count: getCountForNode(allTags, node.name),
  }));
});

const load = (userid, parentForNew = 'root') => tagDao.getHierarchyByUser(userid)
  .then((rec) => {
    if (rec) {
      return rec;
    }
    return tagDao.listAllTags(userid).then(allTags => ({
      tree: init(allTags, parentForNew),
      userid,
      type: 'hierarchy',
    }));
  });

export default {
  loadResponseData,
  load,
};

