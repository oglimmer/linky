/**
 * Log in to Linky with email/password and return a JWT token.
 */
export async function loginToLinky(linkyApiUrl, email, password) {
  const response = await fetch(`${linkyApiUrl}/rest/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Login failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Archive a page: sends HTML to the server which uploads to content backend
 * and creates the link.
 */
export async function archivePage(settings, html, title, originalUrl) {
  const response = await fetch(`${settings.linkyApiUrl}/rest/archive`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.linkyToken}`,
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
