# Form Attribution

> Capture marketing attribution automagically for your website

Form Attribution is a lightweight, open-source JavaScript library that automatically captures marketing attribution data (UTM parameters, referrer, ad click IDs, and more) and injects it into your forms as hidden fields.

Zero manual setup, zero configuration — just add the script to your website and let it do the work for you.

## Quick Start

Add the script to your website before the closing `</body>` tag:

```html
<script src="https://cdn.jsdelivr.net/npm/form-attribution@latest/dist/script.min.js"></script>
```

That's it. The script automatically captures attribution data and injects it into all forms on your page.

## What Gets Captured

### Common URL Parameters (UTM and ref)
- `utm_source` — Traffic source (e.g., google, newsletter)
- `utm_medium` — Marketing medium (e.g., cpc, email)
- `utm_campaign` — Campaign name (e.g., summer_sale)
- `utm_term` — Paid search keywords (e.g., running+shoes)
- `utm_content` — Content variant for A/B testing (e.g., banner_ad_1)
- `utm_id` — Campaign ID (e.g., 12345)
- `ref` - Referral program or partner (e.g., affiliate_name)

### Click IDs (optional, enable with `data-click-ids="true"`)
- `gclid` — Google Ads
- `fbclid` — Meta Ads
- `msclkid` — Microsoft Advertising
- `ttclid` — TikTok Ads
- `li_fat_id` — LinkedIn Ads
- `twclid` — Twitter/X Ads

### Session Data
- `landing_page` — First page URL 
- `current_page` — Current page URL (at time of submission)
- `referrer_url` — Document referrer
- `first_touch_timestamp` — ISO 8601 timestamp of first visit

## How It Works

1. **Add the script** — One line of code, no dependencies
2. **Visitor arrives** — Attribution data is captured and stored automatically
3. **Form fields injected** — Hidden fields are added to all forms on the page
4. **Form submitted** — Attribution data is sent along with the form submission

## Features

- **Zero configuration required** — Works out of the box with sensible defaults
- **Lightweight** — Under 2KB gzipped, no dependencies
- **Privacy-focused** — Respects Global Privacy Control (GPC) and Do Not Track (DNT) preferences
- **Flexible storage** — Choose sessionStorage (default), localStorage, or cookies
- **Form agnostic** — Works with any form: custom HTML, HubSpot, Webflow, WordPress, and more
- **Open source** — Apache 2.0 license, free forever

## Configuration Options

Configure the script using data attributes:

```html
<script src="https://cdn.jsdelivr.net/npm/form-attribution@latest/dist/script.min.js"
  data-storage="localStorage"
  data-field-prefix="attr_"
  data-extra-params="gclid,fbclid"
  data-exclude-forms=".no-track"
  data-click-ids="true"
  data-debug="true">
</script>
```

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-storage` | `sessionStorage` | Storage method: `sessionStorage`, `localStorage`, or `cookie` |
| `data-field-prefix` | `""` | Prefix for hidden field names |
| `data-extra-params` | `""` | Additional URL parameters to capture (comma-separated) |
| `data-exclude-forms` | `""` | CSS selector for forms to exclude |
| `data-click-ids` | `false` | Enable automatic ad platform click ID capture |
| `data-debug` | `false` | Enable debug panel overlay |
| `data-privacy` | `true` | Respect GPC/DNT privacy signals |

## JavaScript API

The library exposes a global `FormAttribution` object:

```javascript
// Get all captured data
const data = FormAttribution.getData();

// Get a specific parameter
const source = FormAttribution.getParam('utm_source');

// Get tracked forms
const forms = FormAttribution.getForms();

// Clear stored data
FormAttribution.clear();

// Re-inject into forms
FormAttribution.refresh();

// Listen for events
FormAttribution.on('onReady', ({ data, config }) => {
  console.log('Attribution ready:', data);
});

FormAttribution.on('onCapture', ({ data }) => {
  console.log('Captured:', data);
});
```

## Debug Panel

Enable a built-in debug overlay for development:

```html
<script src="..." data-debug="true"></script>
```

The debug panel provides:
- **Live data view** — See all captured UTMs and metadata in real-time
- **Form inspector** — Click to highlight any tracked form on the page
- **Activity log** — Track events with timestamps
- **Quick actions** — Copy data as JSON, clear storage, refresh forms

## FAQ

### What forms does this work with?
Form Attribution works with virtually any HTML form! Custom forms, HubSpot, Webflow, WordPress, and more. If it's a standard form element, we'll inject the hidden fields automatically.

### Do I have to add hidden form fields myself?
No. The script automatically detects forms on your page and injects hidden fields with the captured attribution data. No manual setup required.

### Will this slow down my website?
No. The script is tiny and loads from a global network with hundreds of datacenters worldwide. It is optimized for performance and will not block rendering.

### Is it privacy-compliant (GDPR, CCPA)?
Form Attribution respects Global Privacy Control (GPC) and Do Not Track (DNT) preferences by default. No data is sent to third parties — everything stays in the user's browser until it is sent alongside their form submission. However, compliance depends on your specific use case and jurisdiction. We recommend updating your privacy policy accordingly and consulting with a legal expert.

### How long is attribution data stored?
By default, data is stored temporarily (cleared when the browser closes). You can configure local storage for longer persistence or cookies for cross-subdomain tracking.

### Can I customize which parameters are captured?
Absolutely. Use the `data-extra-params` attribute to capture custom URL parameters, or `data-click-ids="true"` to automatically capture ad platform click IDs (gclid, fbclid, etc.).

### Is this really free?
Yes, 100% free and open source under the Apache 2.0 license. No usage limits, no premium tiers, no catch. Use it on as many sites as you want.

## Links

- **Documentation**: https://form-attribution.flashbrew.digital/docs
- **GitHub**: https://github.com/flash-brew-digital/form-attribution
- **NPM**: https://www.npmjs.com/package/form-attribution
- **jsDelivr CDN**: https://cdn.jsdelivr.net/npm/form-attribution@latest/dist/script.min.js

## About

Form Attribution is built and maintained by [Ben Sabic](https://bensabic.ca) at [Flash Brew Digital](https://flashbrew.digital).

After years of setting up marketing attribution for clients — dealing with lost UTM parameters, broken tracking, and expensive third-party tools — this library was created to solve the problem once and for all.

## License

Apache 2.0 — Free for personal and commercial use.

## Support

- **Documentation**: https://form-attribution.flashbrew.digital/docs
- **GitHub Issues**: https://github.com/flash-brew-digital/form-attribution/issues