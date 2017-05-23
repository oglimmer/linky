
import request from 'request-promise';
import randomstring from 'randomstring';

if (process.env.NODE_ENV === 'integrationtest') {
  const email = `${randomstring.generate()}@foo.com`;
  const password = randomstring.generate();

  let token;

  test('create user', (done) => {
    request.post({
      url: 'http://localhost:8080/rest/users',
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
      url: 'http://localhost:8080/rest/authenticate',
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
    let i = 0;
    while (i < 5) {
      i += 1;
      request.post({
        url: 'http://localhost:8080/rest/links',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: {
          url: randomstring.generate(),
          tags: 'nix',
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
      .then(() => done())
      .catch(err => done.fail(err));
    }
  });

  test('get links', (done) => {
    request.get({
      url: 'http://localhost:8080/rest/links/all',
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
