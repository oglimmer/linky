import Immutable from 'immutable';

import { getChildren, getSiblings, toHierarchy, flatten } from './Hierarchy';

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

it('toHierarchy: simple', () => {
  const a = [
    {
      parent: null,
      name: 'root',
      count: 3,
    },
    {
      parent: 'root',
      name: 'a',
      count: 3,
    },
    {
      parent: 'root',
      name: 'b',
      count: 2,
    },
    {
      parent: 'b',
      name: 'c',
      count: 5,
    },
  ];
  const expected = {
    hierarchyLevelName: 'root',
    count: 3,
    collapsed: false,
    children: [
      {
        hierarchyLevelName: 'a',
        count: 3,
        collapsed: false,
        children: [],
      },
      {
        hierarchyLevelName: 'b',
        count: 2,
        collapsed: false,
        children: [
          {
            hierarchyLevelName: 'c',
            count: 5,
            collapsed: false,
            children: [],
          },
        ],
      },
    ] };
  const result = toHierarchy(a);
  expect(result).toEqual(expected);
});

it('flatten: simple', () => {
  const a = {
    hierarchyLevelName: 'root',
    count: 3,
    collapsed: false,
    children: [
      {
        hierarchyLevelName: 'a',
        count: 3,
        collapsed: false,
        children: [],
      },
      {
        hierarchyLevelName: 'b',
        count: 2,
        collapsed: false,
        children: [
          {
            hierarchyLevelName: 'c',
            count: 5,
            collapsed: false,
            children: [],
          },
        ],
      },
    ] };
  const expected = Immutable.List([
    {
      parent: null,
      name: 'root',
      count: 3,
      index: 0,
    },
    {
      parent: 'root',
      name: 'a',
      count: 3,
      index: 0,
    },
    {
      parent: 'root',
      name: 'b',
      count: 2,
      index: 1,
    },
    {
      parent: 'b',
      name: 'c',
      count: 5,
      index: 0,
    },
  ]);
  const result = flatten(a);
  expect(result).toEqual(expected);
});
