# AI GIF Maker for Chrome: selected text to an animated GIF

Turn text into animated GIFs with AI GIF Maker. Native GIF generation — no video conversion. Type what you want and download your GIF in about a minute.

This Chrome extension (Manifest V3) is the official [AI GIF Maker](https://aigifmaker.ai/?utm_source=chrome&utm_medium=extension) client for your browser: select text on any page, right-click, choose **Make a GIF of "…"**, and a notification links to the finished GIF about a minute later.

- Right-click selected text → **Make a GIF of "…"**
- Toolbar popup: type a prompt, see recent GIFs (with previews) and your remaining credits
- Settings page: your API key, stored only in `chrome.storage.local`
- Talks only to `https://aigifmaker.ai` (`/api/ai/generate`, `/api/ai/query`, `/api/user/get-user-credits`)

One GIF costs 1 credit on your AI GIF Maker account, the same as on the website; every new account gets one free GIF (with an aigifmaker.ai badge), and a failed GIF gives its credit back. Get a key at [aigifmaker.ai/settings/apikeys](https://aigifmaker.ai/settings/apikeys); credit packs at [aigifmaker.ai/pricing](https://aigifmaker.ai/pricing?utm_source=chrome&utm_medium=extension).

## Load locally

1. `chrome://extensions` → turn on **Developer mode** → **Load unpacked** → choose `src/`.
2. The settings page opens on first install. Paste your key → **Save and check**.

## Layout

```
src/              extension source (zip root)
scripts/pack.sh   builds aigifmaker-chrome-<version>.zip
scripts/smoke.mjs headless Chrome smoke test (dedicated profile, CDP Extensions.loadUnpacked)
store/            listing copy, privacy policy, permission answers
```

MIT licensed. Source: [github.com/hanshs474/aigifmaker-chrome](https://github.com/hanshs474/aigifmaker-chrome).
