import Immutable from 'immutable';

import {getChildren, getSiblings, toHierarchy, flatten, toNetscape} from './Hierarchy';

it('getSiblings: a', () => {
  const a = [{ name: 'root', parent: null }, { name: 'a', parent: 'root' }];
  const result = getSiblings(a, 'a');
  expect(result).toEqual([{ name: 'a', parent: 'root' }]);
});

it('getSiblings: a-b1', () => {
  const a = [{ name: 'root', parent: null }, { name: 'a', parent: 'root' }, { name: 'b', parent: 'root', count: 1 }];
  const result = getSiblings(a, 'a');
  expect(result).toEqual([{ name: 'a', parent: 'root' }, { name: 'b', parent: 'root', count: 1 }]);
});

it('getSiblings: a-b2', () => {
  const a = [{ name: 'root', parent: null }, { name: 'a', parent: 'root', count: 1 }, { name: 'b', parent: 'root' }];
  const result = getSiblings(a, 'b');
  expect(result).toEqual([{ name: 'a', parent: 'root', count: 1 }, { name: 'b', parent: 'root' }]);
});

it('getChildren: a', () => {
  const a = [{ name: 'root', parent: null }, { name: 'a', parent: 'root' }];
  const result = getChildren(a, 'a');
  expect(result).toEqual([]);
});

it('getChildren: a-aa', () => {
  const a = [{ name: 'root', parent: null }, { name: 'a', parent: 'root' }, { name: 'aa', parent: 'a', count: 1 }];
  const result = getChildren(a, 'a');
  expect(result).toEqual([{ name: 'aa', parent: 'a', count: 1 }]);
});

it('toHierarchy: empty', () => {
  const result = toHierarchy([]);
  expect(result).toEqual({});
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

it('to netscape', () => {
  const tags = [
    {
      parent: null,
      name: 'root',
      count: 0,
    },
    {
      parent: 'root',
      name: 'a',
      count: 1,
    },
    {
      parent: 'root',
      name: 'b',
      count: 2,
    },
    {
      parent: 'b',
      name: 'c',
      count: 1,
    },
  ];
  const links = [
    {
      linkUrl: 'link-a',
      pageTitle: 'la',
      tags: ['a'],
    },
    {
      linkUrl: 'link-b1',
      pageTitle: 'lb1',
      tags: ['b'],
    },
    {
      linkUrl: 'link-b2',
      pageTitle: 'lb2',
      tags: ['b'],
    },
    {
      linkUrl: 'link-c',
      pageTitle: 'lc',
      tags: ['c'],
    },
  ];
  const expected = {
    a: {
      contents: {
        la: 'link-a',
      },
    },
    b: {
      contents: {
        c: {
          contents: {
            lc: 'link-c',
          },
        },
        lb1: 'link-b1',
        lb2: 'link-b2',
      },
    },
  };
  const result = toNetscape(tags, links);
  expect(result).toEqual(expected);
});

it('to netscape (duplicate titles)', () => {
  const tags = [
    {
      parent: null,
      name: 'root',
      count: 0,
    },
    {
      parent: 'root',
      name: 'a',
      count: 1,
    },
    {
      parent: 'a',
      name: 'b',
      count: 2,
    },
  ];
  const links = [
    {
      linkUrl: 'b',
      pageTitle: 'b',
      tags: ['a'],
    },
    {
      linkUrl: 'b',
      pageTitle: 'b',
      tags: ['a'],
    },
  ];
  const expected = {
    a: {
      contents: {
        b: {
          contents: {},
        },
        'b-0': 'b',
        'b-1': 'b',
      },
    },
  };
  const result = toNetscape(tags, links);
  expect(result).toEqual(expected);
});
