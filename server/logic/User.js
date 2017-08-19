import userDao from '../dao/userDao';
import tagDao from '../dao/tagDao';
import TagHierarchyLogic from './TagHierarchy';

export const createUser = userdata =>
  userDao.insert(Object.assign(
    {}, {
      type: 'user',
      createdDate: new Date(),
    },
    userdata,
  ))
    .then(insertResult => TagHierarchyLogic.createTagHierarchyDefault(insertResult.id)
      .then(tagHierarchy => tagDao.insert(tagHierarchy)
        .then(() => insertResult.id),
      ),
    );

export default {};
