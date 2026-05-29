(() => {
    'use strict';

    const STORAGE_KEY = 'enabled';

    function getToggleIconPath(size) {
        return `icons/icon${size}.png`;
    }

    function getStorageArea() {
        try {
            if (
                typeof chrome !== 'undefined' &&
                chrome.storage &&
                chrome.storage.local
            ) {
                return chrome.storage.local;
            }
            if (
                typeof browser !== 'undefined' &&
                browser.storage &&
                browser.storage.local
            ) {
                return browser.storage.local;
            }
        } catch (error) {}
        return null;
    }

    function storageGet(defaults) {
        const area = getStorageArea();
        if (!area) return Promise.resolve(defaults);

        try {
            const result = area.get(defaults);
            if (result && typeof result.then === 'function') return result;
        } catch (error) {}

        return new Promise((resolve) => {
            area.get(defaults, (items) => resolve(items || defaults));
        });
    }

    function storageSet(items) {
        const area = getStorageArea();
        if (!area) return Promise.resolve();

        try {
            const result = area.set(items);
            if (result && typeof result.then === 'function') return result;
        } catch (error) {}

        return new Promise((resolve) => {
            area.set(items, () => resolve());
        });
    }

    function updateUI(enabled) {
        document.body.classList.toggle('disabled', !enabled);
        const label = document.getElementById('state-label');
        const status = document.getElementById('status-text');
        const brandIcon = document.getElementById('brand-icon');
        const helpIcon = document.getElementById('help-icon');
        const contributeIcon = document.getElementById('contribute-icon');

        if (label) label.textContent = enabled ? 'Enabled' : 'Disabled';
        if (status) {
            status.innerHTML = enabled
                ? '<strong>Active.</strong> The extension is enabled.'
                : '<strong>Paused.</strong> The extension is disabled.';
        }
        if (brandIcon) {
            brandIcon.src = getToggleIconPath(128);
        }
        if (helpIcon) {
            helpIcon.src = getToggleIconPath(16);
        }
        if (contributeIcon) {
            contributeIcon.src = getToggleIconPath(16);
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const toggle = document.getElementById('enabled-toggle');
        const defaults = { [STORAGE_KEY]: true };
        const items = await storageGet(defaults);
        const enabled = items[STORAGE_KEY] !== false;

        if (toggle) {
            toggle.checked = enabled;
            toggle.addEventListener('change', async () => {
                const nextEnabled = toggle.checked;
                updateUI(nextEnabled);
                await storageSet({ [STORAGE_KEY]: nextEnabled });
            });
        }

        updateUI(enabled);
    });
})();
