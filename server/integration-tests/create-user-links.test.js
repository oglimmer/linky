
import request from 'request-promise';
import randomstring from 'randomstring';

const names = ['sophia', 'emma', 'olivia', 'ava', 'mia', 'isabella', 'riley', 'aria', 'zoe', 'charlotte', 'lily', 'layla', 'amelia', 'emily', 'madelyn', 'aubrey', 'adalyn', 'madison', 'chloe', 'harper', 'abigail', 'aaliyah', 'avery', 'evelyn', 'kaylee', 'ella', 'ellie', 'scarlett', 'arianna', 'hailey', 'nora', 'addison', 'brooklyn', 'hannah', 'mila', 'leah', 'elizabeth', 'sarah', 'eliana', 'mackenzie', 'peyton', 'maria', 'grace', 'adeline', 'elena', 'anna', 'victoria', 'camilla', 'lillian', 'natalie', 'jackson', 'aiden', 'lucas', 'liam', 'noah', 'ethan', 'mason', 'caden', 'oliver', 'elijah', 'grayson', 'jacob', 'michael', 'benjamin', 'carter', 'james', 'jayden', 'logan', 'alexander', 'caleb', 'ryan', 'luke', 'daniel', 'jack', 'william', 'owen', 'gabriel', 'matthew', 'connor', 'jayce', 'isaac', 'sebastian', 'henry', 'muhammad', 'cameron', 'wyatt', 'dylan', 'nathan', 'nicholas', 'julian', 'eli', 'levi', 'isaiah', 'landon', 'david', 'christian', 'andrew', 'brayden', 'john', 'lincoln'];
const tagStr = () => {
  let tagStrRes = '';
  for (let i = 0; i < 5; i += 1) {
    tagStrRes += names[parseInt(Math.random() * names.length, 10)];
    tagStrRes += ' ';
  }
  return tagStrRes.trim();
};

beforeEach(() => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;
});

if (process.env.NODE_ENV === 'integrationtest') {
  const email = `${randomstring.generate()}@foo.com`;
  const password = randomstring.generate();

  let token;

  const server = process.env.LINKY_SERVER ? process.env.LINKY_SERVER : 'http://localhost:8080';

  test('create user', (done) => {
    request.post({
      url: `${server}/rest/users`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email,
        password,
      },
      json: true,
    })
    .then((result) => {
      expect(result.id).toBeDefined();
      return result;
    })
    // .then((result) => { id = result.id; })
    .then(() => done())
    .catch(err => done.fail(err));
  });

  test('authenticate user', (done) => {
    request.post({
      url: `${server}/rest/authenticate`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email,
        password,
      },
      json: true,
    })
    .then((result) => {
      expect(result.token).toBeDefined();
      return result;
    })
    .then((result) => { token = result.token; })
    .then(() => done())
    .catch(err => done.fail(err));
  });

  test('create links', (done) => {
    const call = (i) => {
      request.post({
        url: `${server}/rest/links`,
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: {
          url: randomstring.generate(),
          tags: tagStr(),
          rssUrl: '',
        },
        json: true,
      })
      .then((result) => {
        expect(result.id).toBeDefined();
        expect(result.linkUrl).toBeDefined();
        expect(result.tags).toBeDefined();
        expect(result.callCounter).toBeDefined();
        expect(result.lastCalled).toBeDefined();
        expect(result.createdDate).toBeDefined();
        expect(result.rssUrl).toBeDefined();
      })
      .then(() => {
        if (i < 10) {
          call(i + 1);
        } else {
          done();
        }
      })
      .catch(err => done.fail(err));
    };
    let j = 0;
    while (j < 5) {
      j += 1;
      call(0);
    }
  });

  test('get links', (done) => {
    request.get({
      url: `${server}/rest/links/all`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      json: true,
    })
    .then((result) => {
      result.forEach((e) => {
        expect(e.id).toBeDefined();
        expect(e.linkUrl).toBeDefined();
        expect(e.tags).toBeDefined();
        expect(e.callCounter).toBeDefined();
        expect(e.lastCalled).toBeDefined();
        expect(e.createdDate).toBeDefined();
        expect(e.rssUrl).toBeDefined();
      });
    })
    .then(() => done())
    .catch(err => done.fail(err));
  });
} else {
  test('fake', () => {
  });
}
