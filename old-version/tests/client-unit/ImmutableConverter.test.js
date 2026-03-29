import Immutable from 'immutable';

import conv from '../../src/util/ImmutableConverter';

it('convert null', () => {
  const a = null;
  const result = conv(a);
  expect(result).toBeNull();
});

it('convert undefined', () => {
  const result = conv();
  expect(result).toBeUndefined();
});

it('no conv in very simple object', () => {
  const a = { name: 'foo' };
  const result = conv(a);
  expect(result).toEqual(a);
});

it('no conv in 2-level object', () => {
  const a = { name: 'foo', achild: { name: 'bar' } };
  const result = conv(a);
  expect(result).toEqual(a);
});

it('conv very simple object', () => {
  const a = { name: 'foo', anArray: ['ele1', 'ele2', 3, 4, false, true] };
  const expected = { name: 'foo', anArray: Immutable.List(['ele1', 'ele2', 3, 4, false, true]) };
  const result = conv(a);
  expect(result).toEqual(expected);
});

it('conv 2-level object', () => {
  const a = { name: 'foo', achild: { anArray: ['ele1', 'ele2', 3, 4, false, true] } };
  const expected = { name: 'foo', achild: { anArray: Immutable.List(['ele1', 'ele2', 3, 4, false, true]) } };
  const result = conv(a);
  expect(result).toEqual(expected);
});

it('conv array in array', () => {
  const a = { name: 'foo', anArray: [1, [1, 2, 3], 2], anotherAttr: 5012 };
  const expected = {
    name: 'foo',
    anArray: Immutable.List.of(
      1,
      Immutable.List.of(1, 2, 3),
      2,
    ),
    anotherAttr: 5012,
  };
  const result = conv(a);
  expect(result).toEqual(expected);
});

it('conv array in array in array', () => {
  const a = { name: 'foo', anArray: [1, [1, 2, ['a', 'b', 'c']], 2], anotherAttr: 5012 };
  const expected = {
    name: 'foo',
    anArray: Immutable.List.of(
      1,
      Immutable.List.of(1, 2, Immutable.List.of('a', 'b', 'c')),
      2,
    ),
    anotherAttr: 5012,
  };
  const result = conv(a);
  expect(result).toEqual(expected);
});

it('conv array in object in array in array', () => {
  const a = { name: 'foo', anArray: [1, [1, 2, { otherArr: ['a', 'b', 'c'] }], 2], anotherAttr: 5012 };
  const expected = {
    name: 'foo',
    anArray: Immutable.List.of(
      1,
      Immutable.List.of(1, 2, {
        otherArr: Immutable.List.of('a', 'b', 'c'),
      }),
      2,
    ),
    anotherAttr: 5012,
  };
  const result = conv(a);
  expect(result).toEqual(expected);
});

it('conv object with Immutable instead of arrays', () => {
  const a = {
    hierarchyLevelName: 'root',
    children: Immutable.List([{
      hierarchyLevelName: 'portal',
      count: 0,
      collapsed: false,
      children: Immutable.List(),
    }, {
      hierarchyLevelName: 'foo',
      children: Immutable.List(),
      count: 0,
      collapsed: false,
    }]),
  };
  const expected = {
    hierarchyLevelName: 'root',
    children: Immutable.List([{
      hierarchyLevelName: 'portal',
      count: 0,
      collapsed: false,
      children: Immutable.List(),
    }, {
      hierarchyLevelName: 'foo',
      children: Immutable.List(),
      count: 0,
      collapsed: false,
    }]),
  };
  const result = conv(a);
  expect(result).toEqual(expected);
});

it('array as root (simple)', () => {
  const a = [{ name: 'foo' }, { name: 'bar' }];
  const expected = Immutable.List([{ name: 'foo' }, { name: 'bar' }]);
  const result = conv(a);
  expect(result).toEqual(expected);
});

it('array as root (nested)', () => {
  const a = [{ name: 'foo' }, { name: 'bar', children: [{ name: 'foo' }, { name: 'bar' }] }];
  const expected = Immutable.List([{ name: 'foo' }, { name: 'bar', children: Immutable.List([{ name: 'foo' }, { name: 'bar' }]) }]);
  const result = conv(a);
  expect(result).toEqual(expected);
});

it('array as root (real)', () => {
  const a = [{
    name: 'all',
    count: 1,
    parent: 'root',
  }, {
    name: 'portal',
    count: 1,
    parent: 'root',
  }, {
    name: 'root',
    count: 0,
    parent: null,
  }];
  const expected = Immutable.List([{
    name: 'all',
    count: 1,
    parent: 'root',
  }, {
    name: 'portal',
    count: 1,
    parent: 'root',
  }, {
    name: 'root',
    count: 0,
    parent: null,
  }]);
  const result = conv(a);
  expect(result).toEqual(expected);
});
