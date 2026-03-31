import { getPageData } from 'single-file-core/single-file.js';

// Guard against duplicate injection
if (!window.__linkyArchiverInjected) {
  window.__linkyArchiverInjected = true;

  browser.runtime.onMessage.addListener((message, _sender) => {
    if (message.action === 'capture-page') {
      return capturePage();
    }
    if (message.action === 'ping') {
      return Promise.resolve({ ready: true });
    }
    return undefined;
  });
}

async function capturePage() {
  try {
    console.log('[Linky Archiver] Starting page capture...');

    const options = {
      url: document.location.href,
      title: document.title,
      blockScripts: true,
      blockVideos: true,
      removeFrames: true,
      removeHiddenElements: true,
      removeUnusedStyles: true,
      removeUnusedFonts: true,
      removeAlternativeImages: true,
      removeAlternativeMedias: true,
      removeAlternativeFonts: true,
      compressHTML: true,
      compressContent: false,
      saveFavicon: true,
      insertSingleFileComment: false,
      insertCanonicalLink: true,
      insertMetaNoIndex: false,
      maxResourceSize: 5,
      maxResourceSizeEnabled: true,
      networkTimeout: 15000,
      onprogress: (event) => {
        console.log('[Linky Archiver] Progress:', event.type);
        // Fire-and-forget, don't let messaging errors kill the capture
        browser.runtime.sendMessage({
          action: 'capture-progress',
          type: event.type,
        }).catch(() => {});
      },
    };

    const initOptions = {
      fetch: (url, fetchOptions = {}) => {
        return fetch(url, {
          ...fetchOptions,
          cache: 'force-cache',
          referrerPolicy: 'strict-origin-when-cross-origin',
        });
      },
    };

    console.log('[Linky Archiver] Calling getPageData...');
    const pageData = await getPageData(options, initOptions, document, window);
    console.log('[Linky Archiver] Capture complete, content length:', pageData.content?.length);

    return {
      html: pageData.content,
      title: pageData.title || document.title,
    };
  } catch (err) {
    console.error('[Linky Archiver] Capture error:', err);
    return { error: err.message || String(err) };
  }
}
