# Company Post Liker

Chrome extension to automatically like posts from your company pages on **Facebook** and **LinkedIn** - even when tabs are in the background.

## Features

- ✅ Auto-likes new posts from your company pages
- ✅ Works in background tabs (no need to keep them open)
- ✅ Smart reloading every 60 minutes to fetch fresh content
- ✅ Prevents duplicate likes using post tracking
- ✅ Human-like delays between actions

## Installation

1. Clone the repo: `git clone https://github.com/yourusername/company-post-liker.git`
2. Open `chrome://extensions/` → Enable **Developer Mode**
3. Click **Load unpacked** → Select the folder
4. Done! 🎉

## Configuration

Edit `background.js`:

```javascript
const FB_PAGES = ["page_id_1", "page_id_2"];
const LI_PAGES = ["company-name-1", "company-name-2"];
```

**How to find IDs:**
- Facebook: `facebook.com/YOUR_PAGE_ID`
- LinkedIn: `linkedin.com/company/YOUR_COMPANY_NAME`

## How It Works

- **background.js** - Reloads tabs every 5 min, sends like commands
- **content.js** - Finds & clicks like buttons on pages
- **manifest.json** - Extension configuration

## Troubleshooting

**Not working?**
- Make sure you're logged into Facebook/LinkedIn
- Check DevTools Console for errors (F12)
- Reload the extension at `chrome://extensions/`

**View logs:**
1. Go to `chrome://extensions/`
2. Click extension name
3. Click "Service Worker" under Inspect views

## ⚠️ Important

Automating social interactions may violate platform terms. Use responsibly on your own company pages only.

## License

MIT
