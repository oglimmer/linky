
import BcryptUtil from './BcryptUtil';

test('hash and compare test', () => {
  const passwordToTest = 'foobar';
  return BcryptUtil.hash(passwordToTest)
    .then(result => BcryptUtil.compare(passwordToTest, result))
    .then((result) => {
      expect(result).toBe(true);
    },
  );
});

test('hash and compare negative test', () => {
  const passwordToTest = 'foobar';
  const passwordToFail = 'barfoo';
  return BcryptUtil.hash(passwordToTest)
    .then(result => BcryptUtil.compare(passwordToFail, result))
    .then((result) => {
      expect(result).toBe(false);
    },
  );
});

