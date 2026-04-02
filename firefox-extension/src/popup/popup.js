import { isTokenValid } from '../lib/api.js';

const archiveBtn = document.getElementById('archive-btn');
const statusEl = document.getElementById('status');
const resultLink = document.getElementById('result-link');
const currentUrlEl = document.getElementById('current-url');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginStatus = document.getElementById('login-status');
const authStatus = document.getElementById('auth-status');

// Show current tab URL
browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  if (tab) currentUrlEl.textContent = tab.url;
});

// Check auth on popup open
browser.storage.local.get(['linkyToken']).then((settings) => {
  updateAuthDisplay(isTokenValid(settings.linkyToken));
});

function updateAuthDisplay(loggedIn) {
  if (loggedIn) {
    authStatus.textContent = 'Logged in';
    authStatus.className = 'auth-status logged-in';
    loginBtn.textContent = 'Re-login with SSO';
    logoutBtn.classList.remove('hidden');
  } else {
    authStatus.textContent = 'Not logged in';
    authStatus.className = 'auth-status not-logged-in';
    loginBtn.textContent = 'Login with SSO';
    logoutBtn.classList.add('hidden');
  }
}

// Login button — delegates to background script
loginBtn.addEventListener('click', async () => {
  showStatus(loginStatus, 'Opening SSO login...', 'info');
  loginBtn.disabled = true;

  try {
    const response = await browser.runtime.sendMessage({ action: 'sso-login' });
    if (response && response.success) {
      showStatus(loginStatus, 'Logged in successfully!', 'success');
      updateAuthDisplay(true);
    } else {
      showStatus(loginStatus, `Login failed: ${response?.error || 'unknown error'}`, 'error');
    }
  } catch (err) {
    showStatus(loginStatus, `Login error: ${err.message}`, 'error');
  } finally {
    loginBtn.disabled = false;
  }
});

// Logout button
logoutBtn.addEventListener('click', async () => {
  await browser.storage.local.remove('linkyToken');
  updateAuthDisplay(false);
});

// Archive button
archiveBtn.addEventListener('click', async () => {
  archiveBtn.disabled = true;
  resultLink.classList.add('hidden');
  showStatus(statusEl, 'Capturing page...', 'info');

  try {
    const response = await browser.runtime.sendMessage({ action: 'archive-page' });
    if (response && response.success) {
      showStatus(statusEl, 'Archived successfully!', 'success');
      resultLink.href = response.archiveUrl;
      resultLink.textContent = response.archiveUrl;
      resultLink.classList.remove('hidden');
    } else {
      showStatus(statusEl, 'Archive failed: unknown error', 'error');
    }
  } catch (err) {
    showStatus(statusEl, `Error: ${err.message}`, 'error');
  } finally {
    archiveBtn.disabled = false;
  }
});

// Listen for progress updates from background/content
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'capture-progress') {
    const labels = {
      'page-loading': 'Loading page...',
      'page-loaded': 'Page loaded, processing...',
      'resources-initialized': 'Processing resources...',
      'resource-loaded': 'Loading resources...',
      'page-ended': 'Uploading...',
    };
    const label = labels[message.type];
    if (label) showStatus(statusEl, label, 'info');
  }
});

function showStatus(el, text, type) {
  el.textContent = text;
  el.className = `status ${type}`;
}
