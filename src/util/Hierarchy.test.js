import Immutable from 'immutable';

import { getChildren, getSiblings } from './Hierarchy';

it('getSiblings: a', () => {
  const children = [{ hierarchyLevelName: 'a', children: [] }];
  const a = { children };
  const result = getSiblings(a, 'a');
  expect(result).toEqual(children);
});

it('getSiblings: a-b1', () => {
  const children = [{ hierarchyLevelName: 'a', children: [] }, { hierarchyLevelName: 'b', children: [] }];
  const a = { children };
  const result = getSiblings(a, 'a');
  expect(result).toEqual(children);
});

it('getSiblings: a-b2', () => {
  const children = [{ hierarchyLevelName: 'a', children: [] }, { hierarchyLevelName: 'b', children: [] }];
  const a = { children };
  const result = getSiblings(a, 'b');
  expect(result).toEqual(children);
});

it('getSiblings: a-b2 (Immutable)', () => {
  const children = Immutable.List([{ hierarchyLevelName: 'a', children: Immutable.List() }, { hierarchyLevelName: 'b', children: Immutable.List() }]);
  const a = { children };
  const result = getSiblings(a, 'b');
  expect(result).toEqual(children);
});

it('getChildren: a', () => {
  const a = { children: [{ hierarchyLevelName: 'a', children: [] }] };
  const result = getChildren(a, 'a');
  expect(result).toEqual([]);
});

it('getChildren: a-aa', () => {
  const children = [{ hierarchyLevelName: 'aa', children: [] }];
  const a = { children: [{ hierarchyLevelName: 'a', children }] };
  const result = getChildren(a, 'a');
  expect(result).toEqual(children);
});

it('getChildren: a-aa (Immutable)', () => {
  const children = Immutable.List([{ hierarchyLevelName: 'aa', children: Immutable.List() }]);
  const a = { children: Immutable.List([{ hierarchyLevelName: 'a', children }]) };
  const result = getChildren(a, 'a');
  expect(result).toEqual(children);
});
