
const makeDateHumanreadble = (date) => {
  let d = date;
  if (typeof d === 'string') {
    d = new Date(d);
  }
  const now = new Date();
  const minAgo = Math.ceil((now.getTime() - d.getTime()) / (1000 * 60));
  if (now.getTime() - d.getTime() < 1000 * 60) {
    return 'now';
  } else if (minAgo < 60) {
    return `${minAgo} minutes ago`;
  } else if (now.getDate() === d.getDate()
      && now.getMonth() === d.getMonth() && now.getFullYear() === d.getFullYear()) {
    return 'today';
  }
  const daysAgo = Math.ceil((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
  if (daysAgo === -1) {
    return 'yesterday';
  }
  return `${daysAgo} days ago`;
};

export default {
  makeDateHumanreadble,
};
