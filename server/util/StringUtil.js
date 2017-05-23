
export default {
};

export const removeTrailingSlash = linkUrl => (new RegExp('\\/$').test(linkUrl) ? linkUrl.substring(0, linkUrl.length - 1) : linkUrl);

