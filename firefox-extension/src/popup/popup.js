import { loginToLinky } from '../lib/api.js';

const archiveBtn = document.getElementById('archive-btn');
const statusEl = document.getElementById('status');
const resultLink = document.getElementById('result-link');
const currentUrlEl = document.getElementById('current-url');
const loginBtn = document.getElementById('login-btn');
const loginStatus = document.getElementById('login-status');

// Show current tab URL
browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  if (tab) currentUrlEl.textContent = tab.url;
});

// Load saved settings
browser.storage.local.get(['linkyApiUrl', 'linkyToken', 'linkyEmail', 'linkyPassword']).then((settings) => {
  if (settings.linkyApiUrl) document.getElementById('linkyApiUrl').value = settings.linkyApiUrl;
  if (settings.linkyEmail) document.getElementById('linkyEmail').value = settings.linkyEmail;
  if (settings.linkyPassword) document.getElementById('linkyPassword').value = settings.linkyPassword;

  // If not logged in, open settings panel
  if (!settings.linkyPassword) {
    document.getElementById('settings-panel').open = true;
  }
});

// Login button
loginBtn.addEventListener('click', async () => {
  const linkyApiUrl = document.getElementById('linkyApiUrl').value.trim();
  const email = document.getElementById('linkyEmail').value.trim();
  const password = document.getElementById('linkyPassword').value;

  if (!linkyApiUrl || !email || !password) {
    showStatus(loginStatus, 'Please fill in URL, email, and password.', 'error');
    return;
  }

  loginBtn.disabled = true;
  showStatus(loginStatus, 'Logging in...', 'info');

  try {
    const token = await loginToLinky(linkyApiUrl, email, password);
    await browser.storage.local.set({ linkyApiUrl, linkyToken: token, linkyEmail: email, linkyPassword: password });
    showStatus(loginStatus, 'Logged in successfully!', 'success');
  } catch (err) {
    showStatus(loginStatus, `Login failed: ${err.message}`, 'error');
  } finally {
    loginBtn.disabled = false;
  }
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
