
import request from 'request-promise';
import randomstring from 'randomstring';

beforeEach(() => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;
});

if (process.env.NODE_ENV === 'integrationtest') {
  const email1 = `${randomstring.generate()}@foo.com`;
  const password1 = 'nopass1';
  const email2 = `${randomstring.generate()}@foo.com`;
  const password2 = 'nopass2';

  let token1;
  let token2;

  const server = process.env.LINKY_SERVER ? process.env.LINKY_SERVER : 'http://localhost:8080';

  test('create users', async (done) => {
    const create = async (email, password) => {
      const result = await request.post({
        url: `${server}/rest/users`,
        headers: { 'Content-Type': 'application/json' },
        body: { email, password },
        json: true,
      });
      expect(result.id).toBeDefined();
    };
    await create(email1, password1);
    await create(email2, password2);
    done();
  });

  test('authenticate users', async (done) => {
    const auth = async (email, password) => {
      const result = await request.post({
        url: `${server}/rest/authenticate`,
        headers: { 'Content-Type': 'application/json' },
        body: { email, password },
        json: true,
      });
      expect(result.token).toBeDefined();
      return result.token;
    };
    token1 = await auth(email1, password1);
    token2 = await auth(email2, password2);
    done();
  });

  test('create link', async (done) => {
    const { primary } = await request.post({
      url: `${server}/rest/links`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token1}`,
      },
      body: {
        url: 'linky1.com',
        tags: 'portal foo bar',
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
    done();
  });

  let link;

  test('get links', async (done) => {
    const result = await request.get({
      url: `${server}/rest/links/all`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token1}`,
      },
      json: true,
    });
    expect(result.length).toEqual(1);
    link = result[0];
    expect(link.id).toBeDefined();
    expect(link.linkUrl).toBeDefined();
    expect(link.tags).toBeDefined();
    expect(link.callCounter).toBeDefined();
    expect(link.lastCalled).toBeDefined();
    expect(link.createdDate).toBeDefined();
    expect(link.rssUrl).toBeDefined();
    done();
  });

  test('update from other user', async (done) => {
    try {
      const result = await request.put({
        url: `${server}/rest/links/${link.id}`,
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token2}`,
        },
        body: {
          url: `${link.linkUrl}-OVERWRITTEN!!!`,
          tags: `${link.tags.join(' ')} overwritten`,
          rssUrl: `${link.rssUrl}-OVERWRITTEN!!!`,
          pageTitle: `${link.pageTitle}-OVERWRITTEN`,
          notes: `${link.notes}-OVERWRITTEN`,
        },
        json: true,
      });
      done.fail(JSON.stringify(result));
    } catch (e) {
      if (e.statusCode === 500) {
        done();
      } else {
        done.fail(e);
      }
    }
  });

  test('update from other same user', async (done) => {
    const { primary } = await request.put({
      url: `${server}/rest/links/${link.id}`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token1}`,
      },
      body: {
        url: `${link.linkUrl}-2!!!`,
        tags: `${link.tags.join(' ')} additionaltag`,
        rssUrl: '',
        pageTitle: `${link.pageTitle}-2`,
        notes: 'some notes',
      },
      json: true,
    });
    expect(primary.id).toEqual(link.id);
    expect(primary.linkUrl).toEqual(`${link.linkUrl}-2!!!`);
    expect(primary.tags).toEqual(['portal', 'foo', 'bar', 'all', 'additionaltag']);
    expect(primary.callCounter).toEqual(0);
    expect(primary.lastCalled).toEqual(link.lastCalled);
    expect(primary.createdDate).toEqual(link.createdDate);
    expect(primary.rssUrl).toEqual('');
    done();
  });

  test('delete from another user', async (done) => {
    try {
      const result = await request.delete({
        url: `${server}/rest/links/${link.id}`,
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token2}`,
        },
        json: true,
      });
      done.fail(JSON.stringify(result));
    } catch (e) {
      if (e.statusCode === 500) {
        done();
      } else {
        done.fail(e);
      }
    }
  });

  test('delete from same user', async (done) => {
    const result = await request.delete({
      url: `${server}/rest/links/${link.id}`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token1}`,
      },
      json: true,
    });
    expect(result.result).toEqual('ok');
    done();
  });
} else {
  test('fake', () => {
  });
}
