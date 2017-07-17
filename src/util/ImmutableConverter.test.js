import Immutable from 'immutable';

import conv from './ImmutableConverter';

it('convert null', () => {
  const a = null;
  const result = conv(a);
  expect(result).toBeNull();
});

it('convert undefined', () => {
  const result = conv();
  expect(result).toBeUndefined();
});

it('error on array', () => {
  expect(() => {
    conv([1, 2, 3]);
  }).toThrow();
});

it('no conv in very simple object', () => {
  const a = { name: 'foo' };
  const result = conv(a);
  expect(result).toEqual(a);
});

it('no conv in very 2-level object', () => {
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

it('conv very 2-level object', () => {
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
