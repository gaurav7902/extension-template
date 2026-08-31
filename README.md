# Browser Extension Template

Reusable Manifest V3 starter for small cross-browser extensions in this workspace.

## Replace placeholders

Before publishing, replace every `{{...}}` placeholder:

| Placeholder | Meaning |
| --- | --- |
| `{{EXTENSION_NAME}}` | Display name |
| `{{EXTENSION_SLUG}}` | Project slug, kebab-case |
| `{{EXTENSION_SLUG_CAMEL}}` | camelCase slug for JS dataset keys |
| `{{EXTENSION_SLUG_KEBAB}}` | kebab-case slug for HTML data attributes |
| `{{EXTENSION_DESCRIPTION}}` | One-sentence manifest/store description |
| `{{TARGET_DOMAIN}}` | Target site domain, for example `youtube.com` |
| `{{REPO_URL}}` | Repository URL |
| `{{AUTHOR_NAME}}` | Author name |
| `{{YEAR}}` | License year |
| `{{SHORT_DESCRIPTION}}` | Store short description |
| `{{LONG_DESCRIPTION}}` | Store long description |
| `{{TAG}}` | Release tag |
| `{{ZIP_NAME}}` | Release zip filename |

## Included files

```text
extension-template/
├── agents.md
├── assets/
│   ├── icon-hd.png
│   ├── promo-tile.png
│   ├── promo-tile.svg
│   └── screenshot.png
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
├── .github/workflows/release-extension.yml
├── generate-extension-zip.sh
├── LICENSE
├── README.md
└── THIRD_PARTY_LICENSES.md
```

## Create a new extension

```bash
cp -r extension-template my-new-extension
cd my-new-extension
rm -rf .git
```

Then:

1. Replace all placeholders.
2. Update `extension/manifest.json` permissions and match patterns.
3. Add final icons in `extension/icons/`.
4. Implement `extension/content.js`.
5. Update popup UI if the extension needs controls.
6. Update README privacy text.
7. Build the zip.

```bash
./generate-extension-zip.sh
```

## Developer install

### Chromium browsers

1. Open `chrome://extensions/`, `edge://extensions/`, or `brave://extensions/`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repo's `extension/` directory.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click Load Temporary Add-on.
3. Select `extension/manifest.json`.
4. If host permissions are not enabled automatically, open the extension permissions panel and allow the target site.

## Packaging

```bash
./generate-extension-zip.sh
```

The generated archive is named `<repo-name>-extension.zip` and contains the files inside `extension/` at the zip root.

## Privacy baseline

This template stores a single `enabled` preference locally using extension storage. It does not collect data, make analytics requests, load remote code, or transmit personal information.

Update this section if your extension adds new storage, permissions, or network behavior.

## Store listing copy

- Short description: {{SHORT_DESCRIPTION}}
- Long description: {{LONG_DESCRIPTION}}

## License

[MIT License](LICENSE)
