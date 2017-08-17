
import request from 'request-promise';
import randomstring from 'randomstring';

if (process.env.NODE_ENV === 'integrationtest') {
  const baseUrl = process.env.LINKY_SERVER ? process.env.LINKY_SERVER : 'http://localhost:8080';
  const createRequest = (body, method) => ({
    url: `${baseUrl}/rest/${method}`,
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    json: true,
  });
  const createUser = body => createRequest(body, 'users');
  const authenticate = body => createRequest(body, 'authenticate');

  const checkAgainstNotEmpty = (err, statusCode, fieldName) => {
    expect(err.statusCode).toBe(statusCode);
    expect(err.error).toEqual({
      message: `${fieldName} must not be empty`,
      reason: `${fieldName} must not be empty`,
    });
  };

  const generateUser = reqbody => request.post(createUser(reqbody))
    .then((result) => {
      expect(result.id).toBeDefined();
      return result;
    });


  test('create user failed email in use mixedCase', (done) => {
    const email = `aaaBBB${randomstring.generate()}@foo.com`;
    const password = randomstring.generate();
    return generateUser({ email, password }).then(() => {
      request.post(createUser({ email, password }))
        .then(html => done.fail(JSON.stringify(html)))
        .catch((err) => {
          expect(err.statusCode).toBe(500);
          expect(err.error).toEqual({
            message: 'Email address already in use',
            reason: 'Email address already in use',
          });
          done();
        });
    })
      .catch(err => done.fail(err));
  });

  test('create user failed email in use uppercase', (done) => {
    const email = `${randomstring.generate()}@foo.com`;
    const password = randomstring.generate();
    return generateUser({ email: email.toLowerCase(), password }).then(() => {
      request.post(createUser({ email: email.toUpperCase(), password }))
        .then(html => done.fail(JSON.stringify(html)))
        .catch((err) => {
          expect(err.statusCode).toBe(500);
          expect(err.error).toEqual({
            message: 'Email address already in use',
            reason: 'Email address already in use',
          });
          done();
        });
    })
      .catch(err => done.fail(err));
  });

  test('create user failed email in use lowercase', (done) => {
    const email = `${randomstring.generate()}@foo.com`;
    const password = randomstring.generate();
    return generateUser({ email: email.toUpperCase(), password }).then(() => {
      request.post(createUser({ email: email.toLowerCase(), password }))
        .then(html => done.fail(JSON.stringify(html)))
        .catch((err) => {
          expect(err.statusCode).toBe(500);
          expect(err.error).toEqual({
            message: 'Email address already in use',
            reason: 'Email address already in use',
          });
          done();
        });
    })
      .catch(err => done.fail(err));
  });

  test('create user failed no data', (done) => {
    request.post(createUser({}))
      .then(html => done.fail(html))
      .catch((err) => {
        checkAgainstNotEmpty(err, 500, 'email');
        done();
      });
  });

  test('create user failed empty email', (done) => {
    request.post(createUser({
      email: '',
      password: 'whatever',
    }))
      .then(html => done.fail(html))
      .catch((err) => {
        checkAgainstNotEmpty(err, 500, 'email');
        done();
      });
  });

  test('create user failed spaced email', (done) => {
    request.post(createUser({
      email: ' ',
      password: 'whatever',
    }))
      .then(html => done.fail(html))
      .catch((err) => {
        checkAgainstNotEmpty(err, 500, 'email');
        done();
      });
  });
  test('create user failed empty password', (done) => {
    request.post(createUser({
      email: `${randomstring.generate()}@foo.com`,
      password: '',
    }))
      .then(html => done.fail(html))
      .catch((err) => {
        checkAgainstNotEmpty(err, 500, 'password');
        done();
      });
  });

  test('create user failed no password', (done) => {
    request.post(createUser({
      email: `${randomstring.generate()}@foo.com`,
    }))
      .then(html => done.fail(html))
      .catch((err) => {
        checkAgainstNotEmpty(err, 500, 'password');
        done();
      });
  });

  test('create user failed space password', (done) => {
    request.post(createUser({
      email: `${randomstring.generate()}@foo.com`,
      password: ' ',
    }))
      .then(html => done.fail(html))
      .catch((err) => {
        checkAgainstNotEmpty(err, 500, 'password');
        done();
      });
  });

  test('authenticate failed wrong password', (done) => {
    const email = `${randomstring.generate()}@foo.com`;
    const password = randomstring.generate();
    return generateUser({ email, password }).then(() => {
      request.post(authenticate({
        email,
        password: 'wrongpassword',
      }))
        .then(html => done.fail(html))
        .catch((err) => {
          expect(err.statusCode).toBe(401);
          expect(err.error).toEqual({
            message: 'Wrong user or password!',
            reason: 'Wrong user or password!',
          });
          done();
        });
    })
      .catch(err => done.fail(err));
  });

  test('authenticate failed empty password', (done) => {
    const email = `${randomstring.generate()}@foo.com`;
    const password = randomstring.generate();
    return generateUser({ email, password }).then(() => {
      request.post(authenticate({
        email,
        password: '',
      }))
        .then(html => done.fail(html))
        .catch((err) => {
          checkAgainstNotEmpty(err, 401, 'password');
          done();
        });
    })
      .catch(err => done.fail(err));
  });

  test('authenticate failed no password', (done) => {
    const email = `${randomstring.generate()}@foo.com`;
    const password = randomstring.generate();
    return generateUser({ email, password }).then(() => {
      request.post(authenticate({
        email,
      }))
        .then(html => done.fail(html))
        .catch((err) => {
          checkAgainstNotEmpty(err, 401, 'password');
          done();
        });
    })
      .catch(err => done.fail(err));
  });

  test('authenticate failed no data', (done) => {
    const email = `${randomstring.generate()}@foo.com`;
    const password = randomstring.generate();
    return generateUser({ email, password }).then(() => {
      request.post(authenticate({}))
        .then(html => done.fail(html))
        .catch((err) => {
          checkAgainstNotEmpty(err, 401, 'email');
          done();
        });
    })
      .catch(err => done.fail(err));
  });
} else {
  test('fake', () => {
  });
}
