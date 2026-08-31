(() => {
  'use strict';

  // Prevent duplicate initialization when a popup manually injects the content
  // script into an already-open tab.
  if (window.__extensionTemplateContentLoaded) {
    return;
  }
  window.__extensionTemplateContentLoaded = true;

  const STORAGE_KEY = 'enabled';
  const DEFAULT_STATE = {
    enabled: true,
  };

  const controller = {
    state: { ...DEFAULT_STATE },
    observer: null,
    applyTimer: null,
  };

  init();

  async function init() {
    try {
      const saved = await storageGet(DEFAULT_STATE);
      controller.state = normalizeState(saved);
      startWatching();
      queueApply(0);
    } catch (error) {
      console.debug('[{{EXTENSION_NAME}}] initialization skipped:', error?.message || error);
    }

    const runtime = getRuntimeApi();
    if (runtime && runtime.onMessage) {
      runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (!message || message.type !== '{{EXTENSION_SLUG}}:settings-updated') {
          return false;
        }

        controller.state = normalizeState(message.state || DEFAULT_STATE);
        safeApplyFeature();
        sendResponse({ ok: true });
        return false;
      });
    }

    const storageArea = getStorageApi();
    if (storageArea && storageArea.onChanged) {
      storageArea.onChanged.addListener((changes, areaName) => {
        if (areaName && areaName !== 'local' && areaName !== 'sync') return;
        if (!Object.prototype.hasOwnProperty.call(changes, STORAGE_KEY)) return;

        controller.state.enabled = changes[STORAGE_KEY].newValue !== false;
        safeApplyFeature();
      });
    }
  }

  function startWatching() {
    // Re-run on browser and app lifecycle events. These cover both normal pages
    // and common single-page apps without needing a polling loop.
    document.addEventListener('DOMContentLoaded', () => queueApply(0), { once: true });
    window.addEventListener('pageshow', () => queueApply(0));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) queueApply(0);
    });

    // YouTube-style SPA events are harmless on non-YouTube pages and useful when
    // adapting this template for a YouTube extension.
    document.addEventListener('yt-navigate-finish', () => queueApply(250));
    window.addEventListener('yt-player-updated', () => queueApply(250));
    document.addEventListener(
      'loadedmetadata',
      (event) => {
        if (event.target instanceof HTMLMediaElement) queueApply(250);
      },
      true,
    );

    if (!controller.observer && document.documentElement) {
      controller.observer = new MutationObserver(() => queueApply(120));
      controller.observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }

  function queueApply(delay) {
    clearTimeout(controller.applyTimer);
    controller.applyTimer = setTimeout(safeApplyFeature, delay);
  }

  function safeApplyFeature() {
    try {
      applyFeature();
    } catch (error) {
      console.debug('[{{EXTENSION_NAME}}] apply skipped:', error?.message || error);
    }
  }

  function applyFeature() {
    if (!controller.state.enabled) {
      disableFeature();
      return;
    }

    // TODO: implement the extension behavior here.
    // Keep DOM selectors scoped to {{TARGET_DOMAIN}} elements your feature owns
    // or directly needs. Avoid broad document rewrites.
    document.documentElement.dataset['{{EXTENSION_SLUG_CAMEL}}Enabled'] = 'true';
  }

  function disableFeature() {
    document.documentElement.removeAttribute('data-{{EXTENSION_SLUG_KEBAB}}-enabled');
  }

  function normalizeState(value) {
    return {
      enabled: value && Object.prototype.hasOwnProperty.call(value, STORAGE_KEY)
        ? value[STORAGE_KEY] !== false
        : DEFAULT_STATE.enabled,
    };
  }

  function getExtensionApi() {
    if (typeof chrome !== 'undefined') return chrome;
    if (typeof browser !== 'undefined') return browser;
    return null;
  }

  function getRuntimeApi() {
    const api = getExtensionApi();
    return api && api.runtime ? api.runtime : null;
  }

  function getStorageApi() {
    const api = getExtensionApi();
    if (!api || !api.storage) return null;
    return api.storage.local || api.storage.sync || null;
  }

  function storageGet(defaults) {
    const storage = getStorageApi();
    if (!storage) return Promise.resolve(defaults);

    try {
      const result = storage.get(defaults);
      if (result && typeof result.then === 'function') return result;
    } catch (error) {}

    return new Promise((resolve) => {
      storage.get(defaults, (items) => resolve(items || defaults));
    });
  }
})();
