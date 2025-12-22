# Form Attribution

Automatically capture and persist marketing attribution parameters (UTM tags, referrer data, landing pages) and inject them into HTML forms as hidden fields.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE.md)
[![npm version](https://img.shields.io/npm/v/form-attribution.svg)](https://www.npmjs.com/package/form-attribution)

**[Try the Script Builder](https://form-attribution.flashbrew.digital)** - Generate a configured script tag with a visual interface.

## Features

- **Zero dependencies** - Self-contained script using only browser APIs
- **Automatic capture** - Captures UTM parameters, referrer, landing page, and timestamps
- **Persistent storage** - Stores attribution data across page visits with smart fallbacks
- **Form injection** - Injects hidden fields into all forms automatically
- **Dynamic form support** - Detects and injects into dynamically added forms via MutationObserver
- **First-touch attribution** - Preserves initial attribution data across subsequent visits
- **Privacy-respecting** - Honors Global Privacy Control (GPC) and Do Not Track (DNT) signals
- **XSS-safe** - Sanitizes all values before injection

## Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/form-attribution@latest/dist/script.min.js"></script>
```

## Quick Start

Add the script to your HTML before the closing `</body>` tag:

```html
<script src="https://cdn.jsdelivr.net/npm/form-attribution@latest/dist/script.min.js"></script>
```

That's it! The script will automatically:

1. Capture UTM parameters from the URL
2. Store them in sessionStorage
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
| `landing_page` | First page URL visited (without query string) |
| `current_page` | Current page URL (without query string) |
| `referrer_url` | Document referrer |
| `first_touch_timestamp` | ISO 8601 timestamp of first visit |

## Configuration

Configure the script using `data-*` attributes on the script tag:

```html
<script src="/dist/script.js"
  data-storage="sessionStorage"
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
| `data-debug` | `false` | Enable console logging |

### Cookie Options

When using `data-storage="cookie"`:

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-cookie-domain` | `""` | Cookie domain (e.g., `.example.com`) |
| `data-cookie-path` | `/` | Cookie path |
| `data-cookie-expires` | `30` | Expiration in days |
| `data-cookie-samesite` | `lax` | SameSite policy: `lax`, `strict`, or `none` |

## Usage Examples

### Capture Google and Facebook Click IDs

```html
<script src="/dist/script.js"
  data-extra-params="gclid,fbclid,msclkid">
</script>
```

### Use localStorage for Longer Persistence

```html
<script src="/dist/script.js"
  data-storage="localStorage">
</script>
```

### Use Cookies for Cross-Subdomain Tracking

```html
<script src="/dist/script.js"
  data-storage="cookie"
  data-cookie-domain=".example.com"
  data-cookie-expires="90">
</script>
```

### Exclude Specific Forms

```html
<script src="/dist/script.js"
  data-exclude-forms=".login-form, [data-no-attribution]">
</script>
```

### Add Field Prefix for CRM Compatibility

```html
<script src="/dist/script.js"
  data-field-prefix="lead_">
</script>
```

This creates fields like `lead_utm_source`, `lead_utm_medium`, etc.

## Script Builder

Use the interactive [Script Builder](https://form-attribution.flashbrew.digital) tool to generate a configured script tag with a visual interface.

## Storage Fallback Chain

The script uses intelligent fallback when storage is unavailable:

| Requested | Fallback Chain |
|-----------|----------------|
| `localStorage` | localStorage → sessionStorage → cookie → memory |
| `sessionStorage` | sessionStorage → cookie → memory |
| `cookie` | cookie → memory |

## Privacy

The script respects user privacy preferences:

- **Global Privacy Control (GPC)** - Disables tracking when `navigator.globalPrivacyControl` is true
- **Do Not Track (DNT)** - Disables tracking when DNT is enabled

When privacy signals are detected, no data is captured or stored.

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

The script uses standard browser APIs with graceful fallbacks:

- URL API for query parameter parsing
- MutationObserver for dynamic form detection
- Web Storage API (sessionStorage/localStorage)
- CookieStore API with legacy `document.cookie` fallback

## License

[Apache-2.0](LICENSE.md)

## Author

[Ben Sabic](https://bensabic.ca)
