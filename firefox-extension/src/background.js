import { archivePage, ssoLogin, isTokenValid } from './lib/api.js';

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'archive-page') {
    return handleArchive();
  }
  if (message.action === 'sso-login') {
    return handleSsoLogin();
  }
  return undefined;
});

async function handleSsoLogin() {
  try {
    const token = await ssoLogin();
    await browser.storage.local.set({ linkyToken: token });
    return { success: true };
  } catch (err) {
    console.error('[Linky Archiver BG] SSO login error:', err);
    return { success: false, error: err.message };
  }
}

async function handleArchive() {
  const { linkyToken } = await browser.storage.local.get(['linkyToken']);

  if (!isTokenValid(linkyToken)) {
    throw new Error('Not logged in or session expired. Please login via SSO.');
  }

  // Get active tab
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    throw new Error('No active tab found.');
  }

  console.log('[Linky Archiver BG] Injecting content script into tab', tab.id);

  // Inject content script
  try {
    await browser.tabs.executeScript(tab.id, { file: 'dist/content.js' });
  } catch (e) {
    console.log('[Linky Archiver BG] executeScript error (may be already injected):', e.message);
  }

  // Wait for content script to be ready
  await waitForContentScript(tab.id);

  console.log('[Linky Archiver BG] Sending capture-page message...');

  // Send capture message to content script
  const result = await browser.tabs.sendMessage(tab.id, { action: 'capture-page' });

  console.log('[Linky Archiver BG] Got result:', result ? `html=${result.html?.length}, error=${result.error}` : 'null');

  if (!result) {
    throw new Error('Page capture failed — no response from content script.');
  }
  if (result.error) {
    throw new Error(`Page capture failed: ${result.error}`);
  }
  if (!result.html) {
    throw new Error('Page capture failed — no HTML returned.');
  }

  // Send HTML to Linky server (server handles content backend upload)
  console.log('[Linky Archiver BG] Sending archive to Linky server...');
  const resp = await archivePage(linkyToken, result.html, result.title, tab.url);

  const archiveUrl = resp.primary?.linkUrl || tab.url;
  console.log('[Linky Archiver BG] Done!', archiveUrl);
  return { success: true, archiveUrl };
}

async function waitForContentScript(tabId, retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await browser.tabs.sendMessage(tabId, { action: 'ping' });
      if (response && response.ready) {
        console.log('[Linky Archiver BG] Content script ready after', i, 'retries');
        return;
      }
    } catch (e) {
      // Content script not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Content script did not respond after injection. The page may block extensions.');
}
