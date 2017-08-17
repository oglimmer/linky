import assert from 'assert';

import { purifyLink } from '../logic/Link';
import { hasTag } from '../logic/TagHierarchy';
import { DUPLICATE } from '../../src/util/TagRegistry';
import linkDao from '../dao/linkDao';


/* eslint-disable no-underscore-dangle */
export const findDuplicatesSingleAddEditLink = (userid, newLinkRec) =>
  linkDao.listByUseridAndUrl(userid, purifyLink(newLinkRec.linkUrl))
    .then(existingLinksWithSameUrl =>
      existingLinksWithSameUrl.filter(row => row._id !== newLinkRec._id))
    .then((existingLinksWithSameUrl) => {
      if (existingLinksWithSameUrl.length > 0) {
        if (!hasTag(newLinkRec.tags, DUPLICATE)) {
          newLinkRec.tags.push(DUPLICATE);
        }
        const collateral = existingLinksWithSameUrl
          .filter(row => !hasTag(row.tags, DUPLICATE))
          .map((row) => {
            row.tags.push(DUPLICATE);
            return row;
          });
        if (collateral.length > 0) {
          return linkDao.bulk({ docs: collateral })
            .then(() => collateral.map((row) => {
              const rowToUpdate = row;
              rowToUpdate.id = row._id;
              return rowToUpdate;
            }));
        }
      }
      return [];
    });
/* eslint-disable no-underscore-dangle */

class DuplicateFinderBase {
  constructor() {
    this.allLinks = new Map();
  }

  counterLink(rec) {
    const nimifiedUrl = purifyLink(rec.linkUrl);
    let counterMap = this.allLinks.get(rec.userid);
    if (!counterMap) {
      counterMap = new Map();
      this.allLinks.set(rec.userid, counterMap);
    }
    const val = counterMap.get(nimifiedUrl);
    if (!val) {
      counterMap.set(nimifiedUrl, 1);
    } else {
      counterMap.set(nimifiedUrl, val + 1);
    }
  }
}

export class CheckLinkDuplicateFinder extends DuplicateFinderBase {
  constructor(changedUserId) {
    super();
    this.changedUserId = changedUserId;
  }

  allLinksInSystem() {
    return Promise.all(Array.from(this.allLinks.entries()).map(([userid, map]) => {
      const linkList = Array.from(map.entries())
        .filter(([, value]) => value > 1)
        .map(([key]) => key);
      return linkDao.listByUserid(userid)
        .then(rows => rows
          .map(row => row.value)
          .filter(rec => linkList.find(link => link === purifyLink(rec.linkUrl)))
          .filter(rec => !hasTag(rec.tags, DUPLICATE))
          .map((rec) => {
            console.log(`${new Date()}: adding duplicate for ${userid} to ${rec.linkUrl}`);
            rec.tags.push(DUPLICATE);
            return rec;
          }),
        )
        .then((docs) => {
          if (docs.length > 0) {
            this.changedUserId.add(userid);
            return linkDao.bulk({ docs });
          }
          return Promise.resolve();
        });
    }));
  }
}


export class ImportDuplicateFinder extends DuplicateFinderBase {
  constructor(allTags) {
    super();
    this.allTags = allTags;
  }

  onImport(docs) {
    // this.allLinks : contains all imported pureUrls/#
    // docs contains all link-objects from import
    assert(this.allLinks.size < 2);
    if (this.allLinks.size === 1) {
      const userid = this.allLinks.keys().next().value;
      return linkDao.listByUserid(userid)
        .then((rows) => {
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
          return linkDao.bulk({ docs: docsToSave }).then(() => docs);
        });
    }
    return docs;
  }
}
