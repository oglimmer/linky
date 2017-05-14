
// $ sudo sysctl -w kern.maxfiles=10485760
// $ sudo sysctl -w kern.maxfilesperproc=1048576


import randomstring from 'randomstring';

import linkDao from './dao/linkDao';

const names = ['Sophia', 'Emma', 'Olivia', 'Ava', 'Mia', 'Isabella', 'Riley', 'Aria', 'Zoe', 'Charlotte', 'Lily', 'Layla', 'Amelia', 'Emily', 'Madelyn', 'Aubrey', 'Adalyn', 'Madison', 'Chloe', 'Harper', 'Abigail', 'Aaliyah', 'Avery', 'Evelyn', 'Kaylee', 'Ella', 'Ellie', 'Scarlett', 'Arianna', 'Hailey', 'Nora', 'Addison', 'Brooklyn', 'Hannah', 'Mila', 'Leah', 'Elizabeth', 'Sarah', 'Eliana', 'Mackenzie', 'Peyton', 'Maria', 'Grace', 'Adeline', 'Elena', 'Anna', 'Victoria', 'Camilla', 'Lillian', 'Natalie', 'Jackson', 'Aiden', 'Lucas', 'Liam', 'Noah', 'Ethan', 'Mason', 'Caden', 'Oliver', 'Elijah', 'Grayson', 'Jacob', 'Michael', 'Benjamin', 'Carter', 'James', 'Jayden', 'Logan', 'Alexander', 'Caleb', 'Ryan', 'Luke', 'Daniel', 'Jack', 'William', 'Owen', 'Gabriel', 'Matthew', 'Connor', 'Jayce', 'Isaac', 'Sebastian', 'Henry', 'Muhammad', 'Cameron', 'Wyatt', 'Dylan', 'Nathan', 'Nicholas', 'Julian', 'Eli', 'Levi', 'Isaiah', 'Landon', 'David', 'Christian', 'Andrew', 'Brayden', 'John', 'Lincoln'];

const create = () => {
  const o = {
    callCounter: parseInt(Math.random() * 10, 10),
    createdDate: new Date(),
    lastCalled: new Date(),
    linkUrl: randomstring.generate(),
    tags: [
      names[parseInt(Math.random() * names.length, 10)],
      names[parseInt(Math.random() * names.length, 10)],
      names[parseInt(Math.random() * names.length, 10)],
      names[parseInt(Math.random() * names.length, 10)],
      names[parseInt(Math.random() * names.length, 10)],
      names[parseInt(Math.random() * names.length, 10)],
    ],
    type: 'link',
    userid: randomstring.generate(),
  };

  linkDao.insert(o)
    .then(() => create())
    .catch(err => console.log(`errro: ${err}`));
};

create();
