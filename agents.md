# AGENTS.md

Guidance for agents working on browser extensions in this workspace.

## Scope

This template is for small Manifest V3 browser extensions built from plain HTML, CSS, and JavaScript unless a project explicitly uses a build system. Most projects keep the unpacked extension in `extension/`; YouTube projects that need browser-specific manifests use `extension/chromium-based/` and `extension/firefox/`.

## Workspace Patterns

Common extension families analyzed:

- Site-specific content-script extensions: `codeforces-darktheme`, `gmail-shortcuts-plus`
- YouTube utilities: `adskip-elite`, `youtube-best-video-quality-always`
- Universal media extension: `volume-booster`
- Build-system extension reference: `competitive-companion-leetcode`
- VS Code extension reference: `obsidian-graph-in-vscode`

For browser extension work, prefer the simple MV3 structure used by the site-specific and YouTube extensions unless the requested feature needs TypeScript/build tooling.

## Default Structure

```text
<extension-root>/
├── extension/
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   └── icons/
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
├── assets/
│   ├── screenshot.png
│   ├── promo-tile.png
│   └── promo-tile.svg
├── .github/workflows/release-extension.yml
├── generate-extension-zip.sh
├── README.md
├── LICENSE
└── THIRD_PARTY_LICENSES.md
```

Use this layout for a single manifest that works in Chromium and Firefox.

Use this layout when Chrome and Firefox need different manifests:

```text
extension/
├── chromium-based/
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── styles.css
│   └── icons/
└── firefox/
    ├── manifest.json
    ├── content.js
    ├── background.js
    ├── popup.html
    ├── popup.js
    ├── styles.css
    └── icons/
```

Add `build-chrome.sh` and `build-firefox.sh` for dual-browser releases.

## Manifest Rules

Always use Manifest V3.

Required baseline:

```json
{
  "manifest_version": 3,
  "name": "{{EXTENSION_NAME}}",
  "version": "0.1.0",
  "description": "{{EXTENSION_DESCRIPTION}}",
  "permissions": ["storage"],
  "host_permissions": ["*://{{TARGET_DOMAIN}}/*", "*://*.{{TARGET_DOMAIN}}/*"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "{{EXTENSION_NAME}}",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "content_scripts": [
    {
      "matches": ["*://{{TARGET_DOMAIN}}/*", "*://*.{{TARGET_DOMAIN}}/*"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ]
}
```

Firefox additions:

```json
"browser_specific_settings": {
  "gecko": {
    "id": "{{EXTENSION_SLUG}}@gauravpatidar.dev",
    "strict_min_version": "128.0",
    "data_collection_permissions": {
      "required": ["none"]
    }
  }
}
```

Chrome background script:

```json
"background": {
  "service_worker": "background.js"
}
```

Firefox background script:

```json
"background": {
  "scripts": ["background.js"]
}
```

## Permission Policy

Keep permissions minimal.

Use:

- `storage` for user preferences and counters
- `notifications` only when the extension shows notifications
- `activeTab`, `scripting`, and `tabs` only when the popup must inject or message scripts on the active tab
- exact host permissions whenever possible

Avoid:

- `<all_urls>` unless the feature is intentionally universal
- `webRequest` unless explicitly required
- broad tabs access for site-specific extensions
- analytics, telemetry, remote code, or external runtime assets

Every README must state whether data is collected. Default statement: no data collection, no analytics, no remote requests, local preferences only.

## JavaScript Conventions

Match the existing project style before editing. Current plain-JS extensions use IIFEs or small controller classes.

Preferred content-script patterns:

- Add a duplicate-load guard with `window.__<slug>ContentLoaded`
- Load preferences from extension storage before applying behavior
- Listen for `storage.onChanged` to sync popup changes
- Use `MutationObserver` scoped to the smallest useful container
- Re-run on SPA lifecycle events only when needed
- Wrap DOM work in safe no-op failure paths
- Never throw uncaught errors from content scripts

Cross-browser API helper:

```js
function getExtensionApi() {
  if (typeof chrome !== 'undefined') return chrome;
  if (typeof browser !== 'undefined') return browser;
  return null;
}
```

Promise-compatible storage helper:

```js
function storageGet(defaults) {
  const api = getExtensionApi();
  const area = api?.storage?.local || api?.storage?.sync;
  if (!area) return Promise.resolve(defaults);

  try {
    const result = area.get(defaults);
    if (result && typeof result.then === 'function') return result;
  } catch {}

  return new Promise((resolve) => {
    area.get(defaults, (items) => resolve(items || defaults));
  });
}
```

Popup pattern:

- Load state on `DOMContentLoaded`
- Render controls from normalized state
- Save to storage on input changes
- Message the active tab only if immediate application is needed
- Show actionable errors such as unsupported page, refresh tab, or no media found

## YouTube Extension Rules

For YouTube features:

- Re-arm on `yt-navigate-finish`, `yt-player-updated`, and media `loadedmetadata`
- Prefer official/player-exposed APIs over simulated UI clicks
- If UI fallback is necessary, add delays and a re-entry lock
- Detect ad playback before touching player controls
- Do not hide, remove, or rewrite ad DOM
- Do not intercept ad network requests
- Scope observers to `#movie_player` where possible
- Avoid polling loops

## Styling and UI

Popup UI should be small, accessible, and self-contained:

- Width around 300-360px
- System font stack
- Clear enabled/disabled state
- All controls keyboard accessible
- No external fonts or CDN assets
- Icons bundled locally

Use `popup.css` for single-manifest template projects. Existing dual-browser YouTube projects use `styles.css`; follow the target project convention.

## README Requirements

Include:

1. Project title
2. Short overview
3. Feature list
4. Developer-mode install instructions for Chromium and Firefox
5. Firefox host-permission note when using `host_permissions`
6. How it works
7. Settings description if there is a popup/options page
8. Packaging command
9. Privacy section
10. License

## Packaging

Single-manifest template:

```bash
./generate-extension-zip.sh
```

The archive should contain the contents of `extension/` at the zip root, not the `extension/` folder itself.

Dual-browser template:

```bash
./build-chrome.sh
./build-firefox.sh
```

Archives should include browser and version in the filename:

```text
{{EXTENSION_SLUG}}-chrome-<version>.zip
{{EXTENSION_SLUG}}-firefox-<version>.zip
```

## Release Workflow

GitHub Actions should:

1. Run on changes to `extension/**`, build scripts, or release workflow
2. Read version from manifest
3. Build zip(s)
4. Upload zip(s) to a release
5. Avoid assuming a hard-coded `extension.zip` when scripts produce slugged zip names

## Placeholders

Replace all placeholders before publishing:

| Placeholder | Meaning |
| --- | --- |
| `{{EXTENSION_NAME}}` | Display name |
| `{{EXTENSION_SLUG}}` | URL/package slug, kebab-case |
| `{{EXTENSION_SLUG_CAMEL}}` | camelCase slug for JS dataset keys |
| `{{EXTENSION_SLUG_KEBAB}}` | kebab-case slug for HTML data attributes |
| `{{EXTENSION_DESCRIPTION}}` | One-sentence manifest/store description |
| `{{TARGET_DOMAIN}}` | Domain used in host permissions and matches |
| `{{REPO_URL}}` | Repository URL |
| `{{AUTHOR_NAME}}` | License/readme author |
| `{{YEAR}}` | License year |
| `{{SHORT_DESCRIPTION}}` | Store short description |
| `{{LONG_DESCRIPTION}}` | Store long description |
| `{{TAG}}` | Release tag |
| `{{ZIP_NAME}}` | Release zip name |

## New Extension Checklist

- [ ] Copy `extension-template/` to the new project directory
- [ ] Remove `.git` from copied template if present
- [ ] Replace every `{{...}}` placeholder
- [ ] Update manifest permissions and match patterns
- [ ] Add final icons and screenshots
- [ ] Implement `content.js`
- [ ] Implement popup/settings pages if needed
- [ ] Update README privacy text
- [ ] Run `./generate-extension-zip.sh`
- [ ] Load unpacked in Chromium
- [ ] Load temporary add-on in Firefox
- [ ] Verify popup, storage sync, and content-script behavior

## Verification

For plain JS extensions, run:

```bash
./generate-extension-zip.sh
```

For dual-browser extensions, run:

```bash
./build-chrome.sh && ./build-firefox.sh
```

For projects with `package.json`, inspect scripts first and run the available lint/typecheck/test commands.
