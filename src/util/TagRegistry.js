
// completely forbidden, always removed
export const ROOT = 'root';

// system set, must never be removed
export const ALL = 'all';
export const ARCHIVE = 'archive';

// system set/unset. must never be removed or set by the user
export const RSS = 'rss';
export const DUEDATE = 'duedate';

// system set, may be removed at any time
export const UNTAGGED = 'untagged';
export const URLUPDATED = 'urlupdated';
export const DUPLICATE = 'duplicate';
export const BROKEN = 'broken';
export const DUE = 'due';

// user set, may be removed at any time
export const PORTAL = 'portal';
export const LOCKED = 'locked';

export const TAGS = [ALL, BROKEN, RSS, UNTAGGED, URLUPDATED, PORTAL, LOCKED, ROOT, DUEDATE, DUE,
  DUPLICATE, ARCHIVE];

// displayed in different color and cannot be removed
export const READONLY_TAGS = [ALL, RSS, ROOT, PORTAL, DUEDATE, DUE, ARCHIVE];

// not allowed on a link, thus will be deleted if found
export const FORBIDDEN_TAGS = [ROOT];

export default {
  TAGS,
  ALL,
  BROKEN,
  RSS,
  UNTAGGED,
  URLUPDATED,
  PORTAL,
  LOCKED,
  READONLY_TAGS,
  ROOT,
  DUEDATE,
  DUE,
  DUPLICATE,
  ARCHIVE,
};
