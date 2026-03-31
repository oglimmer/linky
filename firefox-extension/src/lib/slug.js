/**
 * Generate a URL-safe slug from a page URL.
 * Appends a short hash to avoid collisions.
 */
export function generateSlug(url) {
  let slug = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  slug = slug.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
  slug = slug.substring(0, 50);
  slug = slug.replace(/^-|-$/g, '');

  // Append short hash for uniqueness
  const hash = simpleHash(url);
  slug = slug ? `${slug}-${hash}` : `page-${hash}`;

  if (slug.length < 2) slug = `page-${hash}`;
  return slug;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}
