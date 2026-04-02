const LINKY_API_URL = 'https://www.linky1.com';

/**
 * Perform SSO login using browser.identity.launchWebAuthFlow.
 * The server's /auth/oidc endpoint accepts a redirect_uri that points to the
 * extension's redirect URL. After OIDC completes, the server redirects back
 * with ?token=JWT.
 */
export async function ssoLogin() {
  const redirectURL = browser.identity.getRedirectURL();
  const authURL = `${LINKY_API_URL}/auth/oidc?redirect_uri=${encodeURIComponent(redirectURL)}`;

  const resultURL = await browser.identity.launchWebAuthFlow({
    url: authURL,
    interactive: true,
  });

  const url = new URL(resultURL);
  const token = url.searchParams.get('token');
  if (!token) {
    throw new Error('No token received from SSO');
  }
  return token;
}

/**
 * Check if a JWT token is still valid (not expired).
 */
export function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/**
 * Archive a page: sends HTML to the server which uploads to content backend
 * and creates the link.
 */
export async function archivePage(token, html, title, originalUrl) {
  const response = await fetch(`${LINKY_API_URL}/rest/archive`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html,
      originalUrl,
      pageTitle: title,
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Archive failed (${response.status}): ${text}`);
  }

  return await response.json();
}
