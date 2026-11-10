# Chrome Web Store privacy tab answers

**Single purpose:** Turn text the user selects (or types in the popup) into an animated GIF on aigifmaker.ai with the user's own API key, and tell the user when the GIF is ready.

| Permission | Justification |
|---|---|
| `contextMenus` | Adds one item to the right-click menu when text is selected ("Make a GIF of …"), the extension's main entry point. |
| `storage` | Stores the user's API key and recent GIFs locally (chrome.storage.local) so jobs survive the service worker stopping. Nothing is synced or sent elsewhere. |
| `notifications` | Tells the user when a GIF starts, is ready (click opens it) or fails, since the user is usually on another page by then. |
| `alarms` | Wakes the service worker every 30 seconds only while a GIF is still being made, to resume polling. Cleared when nothing is pending. |
| Host `https://aigifmaker.ai/*` | The extension calls only aigifmaker.ai's own API (generate, query, credits). |

**Remote code:** No. **Data usage:** Authentication information (the API key, used only as the aigifmaker.ai auth header) and Website content (only text the user chose to send). Nothing else. All three disclosures: checked.
