import { diff } from '../../src/util/ArrayUtil';

it('diff to empty result', () => {
  const a = ['a', 'b', 'c', 'd'];
  const b = ['a', 'b', 'c', 'd'];
  const result = diff(a, b);
  expect(result).toEqual([]);
});

it('negative test to diff to empty result', () => {
  const a = ['a', 'b', 'c', 'd'];
  const b = ['a', 'b', 'c', 'd'];
  const result = diff(a, b);
  expect(result).not.toEqual(a);
});

it('diff to one element-1', () => {
  const a = ['a', 'b', 'c', 'd'];
  const b = ['a', 'b', 'c'];
  const result = diff(a, b);
  expect(result).toEqual(['d']);
});

it('diff to one element-2', () => {
  const a = ['a', 'b', 'c', 'd'];
  const b = ['b', 'c', 'd'];
  const result = diff(a, b);
  expect(result).toEqual(['a']);
});

it('diff to one element-3', () => {
  const a = ['a', 'b', 'c', 'd'];
  const b = ['a', 'c', 'd'];
  const result = diff(a, b);
  expect(result).toEqual(['b']);
});

it('diff to one element-4', () => {
  const a = ['a', 'b', 'c', 'd'];
  const b = ['c', 'b', 'a'];
  const result = diff(a, b);
  expect(result).toEqual(['d']);
});

it('diff to two elements-1', () => {
  const a = ['a', 'b', 'c', 'd'];
  const b = ['c', 'a'];
  const result = diff(a, b);
  expect(result).toEqual(expect.arrayContaining(['b']));
  expect(result).toEqual(expect.arrayContaining(['d']));
});

it('diff to all elements-1', () => {
  const a = ['a', 'b', 'c', 'd'];
  const b = [];
  const result = diff(a, b);
  expect(result).toEqual(expect.arrayContaining(['a']));
  expect(result).toEqual(expect.arrayContaining(['b']));
  expect(result).toEqual(expect.arrayContaining(['c']));
  expect(result).toEqual(expect.arrayContaining(['d']));
});

it('diff to one different element-1', () => {
  const a = ['a', 'b', 'c', 'd'];
  const b = ['e'];
  const result = diff(a, b);
  expect(result).toEqual(expect.arrayContaining(['a']));
  expect(result).toEqual(expect.arrayContaining(['b']));
  expect(result).toEqual(expect.arrayContaining(['c']));
  expect(result).toEqual(expect.arrayContaining(['d']));
});

it('diff two empty arrays', () => {
  const a = [];
  const b = [];
  const result = diff(a, b);
  expect(result).toEqual([]);
});

it('diff empty against something', () => {
  const a = [];
  const b = ['a'];
  const result = diff(a, b);
  expect(result).toEqual([]);
});

