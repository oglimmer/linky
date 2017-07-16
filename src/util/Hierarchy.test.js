import Immutable from 'immutable';

import { getChildren, getSiblings } from './Hierarchy';

it('getSiblings: a', () => {
  const children = [{ module: 'a', children: [] }];
  const a = { children };
  const result = getSiblings(a, 'a');
  expect(result).toEqual(children);
});

it('getSiblings: a-b1', () => {
  const children = [{ module: 'a', children: [] }, { module: 'b', children: [] }];
  const a = { children };
  const result = getSiblings(a, 'a');
  expect(result).toEqual(children);
});

it('getSiblings: a-b2', () => {
  const children = [{ module: 'a', children: [] }, { module: 'b', children: [] }];
  const a = { children };
  const result = getSiblings(a, 'b');
  expect(result).toEqual(children);
});

it('getSiblings: a-b2 (Immutable)', () => {
  const children = Immutable.List([{ module: 'a', children: Immutable.List() }, { module: 'b', children: Immutable.List() }]);
  const a = { children };
  const result = getSiblings(a, 'b');
  expect(result).toEqual(children);
});

it('getChildren: a', () => {
  const a = { children: [{ module: 'a', children: [] }] };
  const result = getChildren(a, 'a');
  expect(result).toEqual([]);
});

it('getChildren: a-aa', () => {
  const children = [{ module: 'aa', children: [] }];
  const a = { children: [{ module: 'a', children }] };
  const result = getChildren(a, 'a');
  expect(result).toEqual(children);
});

it('getChildren: a-aa (Immutable)', () => {
  const children = Immutable.List([{ module: 'aa', children: Immutable.List() }]);
  const a = { children: Immutable.List([{ module: 'a', children }]) };
  const result = getChildren(a, 'a');
  expect(result).toEqual(children);
});
