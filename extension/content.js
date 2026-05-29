(function () {
    'use strict';

    const STORAGE_KEY = 'enabled';
    let themeEnabled = true;
    let themeInitialized = false;
    const cleanupCallbacks = [];
    const resourceNodes = [];

    function getRuntimeURL(path) {
        try {
            if (
                typeof chrome !== 'undefined' &&
                chrome.runtime &&
                chrome.runtime.getURL
            ) {
                return chrome.runtime.getURL(path);
            }
            if (
                typeof browser !== 'undefined' &&
                browser.runtime &&
                browser.runtime.getURL
            ) {
                return browser.runtime.getURL(path);
            }
        } catch (error) {}
        return path;
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

    function addCleanup(fn) {
        cleanupCallbacks.push(fn);
    }

    function clearCleanupCallbacks() {
        while (cleanupCallbacks.length > 0) {
            const fn = cleanupCallbacks.pop();
            try {
                fn();
            } catch (error) {}
        }
    }

    function removeInjectedResources() {
        while (resourceNodes.length > 0) {
            const node = resourceNodes.pop();
            try {
                if (node && node.parentNode) node.parentNode.removeChild(node);
            } catch (error) {}
        }
    }

    function injectResource(tagName, attrs) {
        const parent = document.head || document.documentElement;
        if (!parent) return null;

        const node = document.createElement(tagName);
        for (const key in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, key)) {
                node.setAttribute(key, attrs[key]);
            }
        }
        parent.appendChild(node);
        resourceNodes.push(node);
        return node;
    }

    function loadLocalStyles() {
        injectResource('link', {
            rel: 'stylesheet',
            href: getRuntimeURL('darktheme.css'),
            'data-extension-template': 'true',
        });
        injectResource('link', {
            rel: 'stylesheet',
            href: getRuntimeURL('desert.css'),
            'data-extension-template': 'true',
        });
        injectResource('link', {
            rel: 'stylesheet',
            href: getRuntimeURL('monokai.css'),
            'data-extension-template': 'true',
        });
    }

    function enableTheme() {
        if (themeInitialized) return;
        themeInitialized = true;
        loadLocalStyles();
    }

    function disableTheme() {
        if (!themeInitialized) {
            removeInjectedResources();
            return;
        }

        themeInitialized = false;
        clearCleanupCallbacks();
        removeInjectedResources();
    }

    function setThemeEnabled(enabled) {
        themeEnabled = enabled !== false;

        if (themeEnabled) {
            enableTheme();
        } else {
            disableTheme();
        }
    }

    storageGet({ [STORAGE_KEY]: true })
        .then((items) => {
            setThemeEnabled(items[STORAGE_KEY] !== false);
        })
        .catch(() => {
            setThemeEnabled(true);
        });

    const storageArea = getStorageArea();
    if (
        storageArea &&
        storageArea.onChanged &&
        storageArea.onChanged.addListener
    ) {
        storageArea.onChanged.addListener((changes) => {
            if (
                changes &&
                Object.prototype.hasOwnProperty.call(changes, STORAGE_KEY)
            ) {
                const nextEnabled = changes[STORAGE_KEY].newValue !== false;
                setThemeEnabled(nextEnabled);
            }
        });
    }
})();