
import request from 'request-promise';
import randomstring from 'randomstring';
import BlueBirdPromise from 'bluebird';

const TOTAL_NUMBER_LINKS = 20;
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

  test('create user', async (done) => {
    const result = await request.post({
      url: `${server}/rest/users`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email,
        password,
      },
      json: true,
    });
    expect(result.id).toBeDefined();
    done();
  });

  test('authenticate user', async (done) => {
    const result = await request.post({
      url: `${server}/rest/authenticate`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email,
        password,
      },
      json: true,
    });
    expect(result.token).toBeDefined();
    token = result.token;
    done();
  });

  test('create links', async (done) => {
    const integerArray = [...Array(TOTAL_NUMBER_LINKS).keys()].map(i => i);
    await BlueBirdPromise.map(integerArray, async () => {
      const { primary } = await request.post({
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
      });
      expect(primary.id).toBeDefined();
      expect(primary.linkUrl).toBeDefined();
      expect(primary.tags).toBeDefined();
      expect(primary.callCounter).toBeDefined();
      expect(primary.lastCalled).toBeDefined();
      expect(primary.createdDate).toBeDefined();
      expect(primary.rssUrl).toBeDefined();
    }, { concurrency: 5 });
    done();
  });

  test('get links', async (done) => {
    const result = await request.get({
      url: `${server}/rest/links/all`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      json: true,
    });
    expect(result.length).toEqual(TOTAL_NUMBER_LINKS);
    result.forEach((e) => {
      expect(e.id).toBeDefined();
      expect(e.linkUrl).toBeDefined();
      expect(e.tags).toBeDefined();
      expect(e.callCounter).toBeDefined();
      expect(e.lastCalled).toBeDefined();
      expect(e.createdDate).toBeDefined();
      expect(e.rssUrl).toBeDefined();
    });
    done();
  });
} else {
  test('fake', () => {
  });
}
