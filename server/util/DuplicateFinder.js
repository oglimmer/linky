import assert from 'assert';

import { purifyLink } from '../logic/Link';
import { hasTag } from '../logic/TagHierarchy';
import { DUPLICATE } from '../../src/util/TagRegistry';
import linkDao from '../dao/linkDao';


/* eslint-disable no-underscore-dangle */
export const findDuplicatesSingleAddEditLink = async (userid, newLinkRec) => {
  const baseExistingLinksWithSameUrl =
    await linkDao.listByUseridAndUrl(userid, purifyLink(newLinkRec.linkUrl));
  const existingLinksWithSameUrl =
    await baseExistingLinksWithSameUrl.filter(row => row._id !== newLinkRec._id);
  if (existingLinksWithSameUrl.length > 0) {
    if (!hasTag(newLinkRec.tags, DUPLICATE)) {
      newLinkRec.tags.push(DUPLICATE);
    }
    const collateral = existingLinksWithSameUrl.filter(row => !hasTag(row.tags, DUPLICATE));
    if (collateral.length > 0) {
      collateral.forEach((row) => { row.tags.push(DUPLICATE); });
      await linkDao.bulk({ docs: collateral });
      return collateral.map(row => Object.assign({}, row, { id: row._id }));
    }
  }
  return [];
};
/* eslint-disable no-underscore-dangle */

class DuplicateFinderBase {
  constructor() {
    this.allLinks = new Map();
  }

  counterLink(rec) {
    const purifiedUrl = purifyLink(rec.linkUrl);
    // console.log(`purifiedUrl = ${purifiedUrl}`)
    let counterMap = this.allLinks.get(rec.userid);
    if (!counterMap) {
      counterMap = new Map();
      this.allLinks.set(rec.userid, counterMap);
    }
    const val = counterMap.get(purifiedUrl);
    if (!val) {
      counterMap.set(purifiedUrl, 1);
    } else {
      counterMap.set(purifiedUrl, val + 1);
    }
  }
}

export class CheckLinkDuplicateFinder extends DuplicateFinderBase {
  constructor(changedUserId) {
    super();
    this.changedUserId = changedUserId;
  }

  async allLinksInSystem() {
    const promises = Array.from(this.allLinks.entries()).map(async ([userid, map]) => {
      const linkList = Array.from(map.entries())
        .filter(([, value]) => value > 1)
        .map(([key]) => key);
      const rows = await linkDao.listByUserid(userid);
      const docs = rows
        .map(row => row.value)
        .filter(rec => linkList.find(link => link === purifyLink(rec.linkUrl)))
        .filter(rec => !hasTag(rec.tags, DUPLICATE));
      if (docs.length > 0) {
        docs.forEach((rec) => {
          console.log(`${new Date()}: adding duplicate for ${userid} to ${rec.linkUrl}`);
          rec.tags.push(DUPLICATE);
        });
        this.changedUserId.add(userid);
        await linkDao.bulk({ docs });
      }
    });
    await Promise.all(promises);
  }
}


export class ImportDuplicateFinder extends DuplicateFinderBase {
  constructor(allTags) {
    super();
    this.allTags = allTags;
  }

  async onImport(docs) {
    // docs contains all link-objects to be imported
    docs.forEach((doc) => { this.counterLink(doc); });
    // now this.allLinks contains all imported pureUrls/#
    assert(this.allLinks.size < 2);
    if (this.allLinks.size === 1) {
      const userid = this.allLinks.keys().next().value;
      const rows = await linkDao.listByUserid(userid);
      // all current links in rows
      const allExistingLinks = rows.map(row => row.value);
      allExistingLinks.forEach((row) => {
        this.counterLink(row);
      });
      // all duplicates in new and existing links are in this.allLinks
      const map = this.allLinks.values().next().value;
      const docsToSave = [];
      Array.from(map.entries())
        .filter(([, value]) => value > 1)
        .map(([key]) => key)
        .forEach((duplicatedUrl) => {
          docs.filter(rec => purifyLink(rec.linkUrl) === duplicatedUrl)
            .filter(rec => !hasTag(rec.tags, DUPLICATE))
            .forEach((rec) => {
              rec.tags.push(DUPLICATE);
              this.allTags.add(DUPLICATE);
            });
          allExistingLinks.filter(rec => purifyLink(rec.linkUrl) === duplicatedUrl)
            .filter(rec => !hasTag(rec.tags, DUPLICATE))
            .forEach((rec) => {
              rec.tags.push(DUPLICATE);
              this.allTags.add(DUPLICATE);
              docsToSave.push(rec);
            });
        });
      if (docsToSave.length > 0) {
        await linkDao.bulk({ docs: docsToSave });
      }
    }
  }
}
