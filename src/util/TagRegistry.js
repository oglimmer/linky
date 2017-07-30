

export const ALL = 'all';
export const BROKEN = 'broken';
export const RSS = 'rss';
export const UNTAGGED = 'untagged';
export const URLUPDATED = 'urlupdated';
export const PORTAL = 'portal';
export const LOCKED = 'locked';
export const ROOT = 'root';
export const DUEDATE = 'duedate';
export const DUE = 'due';

export const TAGS = [ALL, BROKEN, RSS, UNTAGGED, URLUPDATED, PORTAL, LOCKED, ROOT, DUEDATE, DUE];

export const READONLY_TAGS = [ALL, RSS, ROOT, PORTAL, DUEDATE, DUE];

export const FORBIDDEN_TAGS = [ROOT, DUEDATE];

export default {
  TAGS, ALL, BROKEN, RSS, UNTAGGED, URLUPDATED, PORTAL, LOCKED, READONLY_TAGS, ROOT, DUEDATE, DUE,
};
