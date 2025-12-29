# Form Attribution

A lightweight, zero-dependency script that automatically captures and passes the referrer, UTM parameters, ad click IDs, and more to your forms as hidden fields.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE.md)
[![npm version](https://img.shields.io/npm/v/form-attribution.svg)](https://www.npmjs.com/package/form-attribution)

**[Try the Script Builder](https://form-attribution.flashbrew.digital/builder?utm_source=github&utm_medium=referral&utm_campaign=readme)** |
**[View Documentation](https://form-attribution.flashbrew.digital/docs?utm_source=github&utm_medium=referral&utm_campaign=readme)**

## Features

- **Zero dependencies** - Runs entirely on native browser APIs with no external libraries
- **Automatic capture** - Records UTM parameters, referrer URL, landing page, timestamp and more without manual setup
- **Persistent storage** - Maintains attribution data across sessions using intelligent storage fallbacks
- **Form injection** - Automatically adds hidden fields to every form on the page
- **Dynamic form support** - Monitors the DOM via MutationObserver to handle forms added after page load
- **First-touch attribution** - Retains original attribution data even when users return later
- **Privacy-respecting** - Complies with Global Privacy Control (GPC) and Do Not Track (DNT) preferences
- **XSS-safe** - Sanitizes all injected values to prevent cross-site scripting attacks
- **Debug panel** - Visual overlay for inspecting attribution data, forms, and activity in real-time
- **JavaScript API** - Programmatic access via `window.FormAttribution` for custom integrations

## Quick Start

Add the script to your website before the closing `</body>`tag:

```html
<script src="https://cdn.jsdelivr.net/npm/form-attribution@latest/dist/script.min.js"></script>
```

That's it! The script will automatically:

1. Capture common URL parameters and metadata (e.g. landing page)
2. Store the data in the user's browser temporarily
3. Inject hidden fields into all forms on the page

## Parameters Captured

### URL Parameters (default)

| Parameter | Description |
|-----------|-------------|
| `utm_source` | Traffic source (e.g., google, newsletter) |
| `utm_medium` | Marketing medium (e.g., cpc, email) |
| `utm_campaign` | Campaign name |
| `utm_term` | Paid search keywords |
| `utm_content` | Content variant for A/B testing |
| `utm_id` | Campaign ID |
| `ref` | Referrer tracking parameter |

### Metadata (automatically captured)

| Parameter | Description |
|-----------|-------------|
| `landing_page` | First page URL visited |
| `current_page` | Current page URL (where form was submitted) |
| `referrer_url` | Document referrer |
| `first_touch_timestamp` | ISO 8601 timestamp of first visit |

### Click ID Parameters (when `data-click-ids="true"`)

| Parameter | Platform |
|-----------|----------|
| `gclid` | Google Ads |
| `fbclid` | Meta Ads |
| `msclkid` | Microsoft Advertising |
| `ttclid` | TikTok Ads |
| `li_fat_id` | LinkedIn Ads |
| `twclid` | Twitter/X Ads |

## Configuration

Configure the script by adding optional data attributes to the script tag:

```html
<script src="/dist/script.min.js"
  data-storage="localStorage"
  data-field-prefix="attr_"
  data-extra-params="gclid,fbclid"
  data-exclude-forms=".no-track"
  data-debug="true">
</script>
```

### Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-storage` | `sessionStorage` | Storage method: `sessionStorage`, `localStorage`, or `cookie` |
| `data-field-prefix` | `""` | Prefix for hidden field names (e.g., `attr_` creates `attr_utm_source`) |
| `data-extra-params` | `""` | Comma-separated list of additional URL parameters to capture |
| `data-exclude-forms` | `""` | CSS selector for forms to exclude from injection |
| `data-storage-key` | `form_attribution_data` | Custom key name for stored data |
| `data-debug` | `false` | Enable console logging and debug panel |
| `data-privacy` | `true` | Set to `"false"` to disable GPC/DNT privacy signal detection |
| `data-click-ids` | `false` | Set to `"true"` to automatically capture ad platform click IDs |

### Cookie Options

When using `data-storage="cookie"`:

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-cookie-domain` | `""` | Cookie domain (e.g., `.example.com`) |
| `data-cookie-path` | `/` | Cookie path |
| `data-cookie-expires` | `30` | Expiration in days |
| `data-cookie-samesite` | `lax` | SameSite policy: `lax`, `strict`, or `none` |

## Usage Examples

### Use localStorage for Longer Persistence

```html
<script src="/dist/script.min.js"
  data-storage="localStorage">
</script>
```

### Use Cookies for Cross-Subdomain Tracking

```html
<script src="/dist/script.min.js"
  data-storage="cookie"
  data-cookie-domain=".example.com"
  data-cookie-expires="90">
</script>
```

### Exclude Specific Forms

```html
<script src="/dist/script.min.js"
  data-exclude-forms=".login-form, [data-no-attribution]">
</script>
```

### Add Field Prefix for CRM Compatibility

```html
<script src="/dist/script.min.js"
  data-field-prefix="lead_">
</script>
```

## Script Builder

Use the interactive [Script Builder](https://form-attribution.flashbrew.digital/builder?utm_source=github&utm_medium=referral&utm_campaign=readme) tool to generate a configured script tag with a visual interface.

## Storage Fallback Chain

The script uses intelligent fallbacks when a storage type isn't available:

| Requested | Fallback Chain |
|-----------|----------------|
| `localStorage` | localStorage → sessionStorage → cookie → memory |
| `sessionStorage` | sessionStorage → cookie → memory |
| `cookie` | cookie → memory |

## Privacy

By default, the script respects user privacy preferences:

- **Global Privacy Control (GPC)** - Disables tracking when `navigator.globalPrivacyControl` is true
- **Do Not Track (DNT)** - Disables tracking when DNT is enabled

When privacy signals are detected, no data is captured or stored. You can override this behavior by setting `data-privacy="false"` on the script tag.

## JavaScript API

Form Attribution exposes a global `FormAttribution` object for programmatic access:

```javascript
// Get all attribution data
const data = FormAttribution.getData();

// Get a specific parameter
const source = FormAttribution.getParam('utm_source');

// Get tracked forms with their status
const forms = FormAttribution.getForms();

// Clear all stored data
FormAttribution.clear();

// Re-inject data into forms
FormAttribution.refresh();

// Register event callbacks (supports multiple listeners)
FormAttribution.on('onReady', ({ data, config }) => {
  console.log('Attribution ready:', data);
});

// Remove a callback
FormAttribution.off('onCapture', myHandler);
```

### Available Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getData()` | `Object\|null` | Get all captured attribution data |
| `getParam(name)` | `string\|null` | Get a specific parameter value |
| `getForms()` | `Array` | Get list of forms with their status |
| `clear()` | `void` | Clear all stored attribution data |
| `refresh()` | `void` | Re-inject data into all forms |
| `on(event, cb)` | `Object` | Register event callback (chainable) |
| `off(event, cb)` | `Object` | Unregister a callback (chainable) |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onReady` | `{ data, config }` | Fired when initialization is complete |
| `onCapture` | `{ data }` | Fired when new data is captured |
| `onUpdate` | `{ data }` | Fired when data is updated |

## Debug Panel

Enable the debug panel by adding `data-debug="true"` to the script tag:

```html
<script src="/dist/script.min.js" data-debug="true"></script>
```

The debug panel provides:

- **Data Tab** - View all captured UTM parameters and metadata
- **Forms Tab** - See all forms and their injection status (click to highlight)
- **Log Tab** - Real-time activity log with timestamps
- **Actions** - Copy data to clipboard, clear storage, refresh forms

The panel is draggable, collapsible, and its state persists across page reloads. Uses Shadow DOM for style isolation.

> **Note:** Remove `data-debug` before deploying to production.

## Injected Fields

Hidden fields are injected with the following attributes:

```html
<input type="hidden"
  name="utm_source"
  value="google"
  data-form-attribution="true"
  data-form-attribution-managed="true">
```

- Existing hidden fields with matching names are updated (no duplicates created)
- User-visible form fields are never modified
- All values are HTML-entity encoded for XSS protection

## Development

### Prerequisites

- Node.js
- pnpm

### Setup

```bash
pnpm install
```

### Commands

```bash
pnpm test                         # Run Playwright tests (Chromium, Firefox, WebKit)
pnpm exec playwright test --ui    # Run tests with interactive UI
pnpm check                        # Lint with Biome
pnpm fix                          # Auto-fix lint issues
```

## Browser Support

Built on standard browser APIs with graceful fallbacks for broad compatibility:

- **URL API** — Parses query parameters
- **MutationObserver** — Detects dynamically added forms
- **Web Storage API** — Persists data via sessionStorage and localStorage
- **CookieStore API** — Falls back to `document.cookie` for older 

## Documentation

Complete documentation is available at [https://form-attribution.flashbrew.digital/docs](https://form-attribution.flashbrew.digital/docs?utm_source=github&utm_medium=referral&utm_campaign=readme).

## License

[Apache-2.0](LICENSE.md)

---

Built by [Ben Sabic](https://bensabic.ca?utm_source=github&utm_medium=referral&utm_campaign=readme) at [Flash Brew Digital](https://flashbrew.digital?utm_source=github&utm_medium=referral&utm_campaign=readme) | [GitHub](https://github.com/Flash-Brew-Digital/form-attribution)
