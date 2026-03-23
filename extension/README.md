# SignalFlow Chrome Extension

A Manifest V3 Chrome extension that adds a **✨ Save Lead** button to LinkedIn profiles.

## How to Install

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project

## How to Configure

After installing, click the **SignalFlow ⚡** icon in your Chrome toolbar:

1. **Dashboard URL** — Your SignalFlow app URL (e.g. `https://your-app.replit.app`)
2. **API Key** — Your `SIGNALFLOW_API_KEY` secret value
3. Click **Save Settings**

## How to Use

1. Visit any LinkedIn profile (`linkedin.com/in/...`)
2. The **✨ Save Lead** button appears near the top of the profile
3. Click it to capture the lead — name, title, and profile URL are scraped and sent to your dashboard instantly

## Files

| File | Description |
|------|-------------|
| `manifest.json` | Manifest V3 config |
| `content.js` | Injects the Save Lead button on LinkedIn profiles |
| `popup.html` / `popup.js` | Extension settings popup |
| `icons/` | Extension icons (16px, 48px, 128px) |
