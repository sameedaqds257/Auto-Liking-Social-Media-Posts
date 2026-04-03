# Company Post Liker

Chrome extension to automatically like posts from your company pages on **Facebook** and **LinkedIn** - even when tabs are in the background.
Note: Please open each page intended for like, in seperate tab.
## Features

- ✅ Auto-likes new posts from your company pages
- ✅ Works in background tabs(just keep each page open in background)
- ✅ Smart reloading every 60 minutes to fetch fresh content

## Installation
Note: If you do not have Git preinstalled, please run this in your system's Command Prompt: winget install --id Git.Git -e --source winget
1. Clone the repo: `[https://github.com/sameedaqds257/Auto-Liking-Social-Media-Posts.git]`
2. Open `chrome://extensions/` → Enable **Developer Mode**
3. Click **Load unpacked** → Select the folder
4. Done! 🎉

## Configuration

Edit Facebook or Linkedin page:
1. Click on Puzzle logo on Google Chrome app bar.
2. Click on the extension: Company Post Liker.
3. Add or remove page id of Facebook or Linkedin.

**How to find IDs:**
- Facebook: `facebook.com/YOUR_PAGE_ID`
- LinkedIn: `linkedin.com/company/YOUR_COMPANY_NAME`

## How It Works

- **background.js** - Reloads tabs every 60 min, sends like commands
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


