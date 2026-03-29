
import BcryptUtil from '../../server/util/BcryptUtil';

test('hash and compare test', async () => {
  const passwordToTest = 'foobar';
  const hash = await BcryptUtil.hash(passwordToTest);
  const compareResult = await BcryptUtil.compare(passwordToTest, hash);
  expect(compareResult).toBe(true);
});

test('hash and compare negative test', async () => {
  const passwordToTest = 'foobar';
  const passwordToFail = 'barfoo';
  const hash = await BcryptUtil.hash(passwordToTest);
  const compareResult = await BcryptUtil.compare(passwordToFail, hash);
  expect(compareResult).toBe(false);
});
