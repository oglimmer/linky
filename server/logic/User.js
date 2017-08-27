import userDao from '../dao/userDao';
import tagDao from '../dao/tagDao';
import TagHierarchyLogic from './TagHierarchy';

export const createUser = async (userdata) => {
  const insertResult = await userDao.insert(Object.assign(
    {}, {
      type: 'user',
      createdDate: new Date(),
    },
    userdata,
  ));
  const tagHierarchy = await TagHierarchyLogic.createTagHierarchyDefault(insertResult.id);
  await tagDao.insert(tagHierarchy);
  return insertResult.id;
};

export default {};
