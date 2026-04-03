
const FB_PAGES = ["61573834194646", "zaavia.net"];
const LI_PAGES = ["saerintechllc", "zaavia"];
const CHECK_INTERVAL = 60; // in minutes
const RELOAD_INTERVAL = 60; // in minutes

let lastReloadTimes = {}; // Track reload times per tab
let customFbPages = FB_PAGES;
let customLiPages = LI_PAGES;

function loadCustomPagesFromStorage() {
  chrome.storage.local.get(['fbPages', 'liPages'], (result) => {
    if (result.fbPages) {
      customFbPages = Array.isArray(result.fbPages)
        ? result.fbPages
        : result.fbPages.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      customFbPages = FB_PAGES;
    }

    if (result.liPages) {
      customLiPages = Array.isArray(result.liPages)
        ? result.liPages
        : result.liPages.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      customLiPages = LI_PAGES;
    }

    console.log('Loaded custom FB pages:', customFbPages);
    console.log('Loaded custom LI pages:', customLiPages);
  });
}

function ensureAlarms() {
  // Recreate alarms with current desired intervals so toggles/changes take effect.
  chrome.alarms.create('checkNewPosts', { periodInMinutes: CHECK_INTERVAL });
  chrome.alarms.create('reloadTabs', { periodInMinutes: RELOAD_INTERVAL });
  console.log(`Ensured alarms: checkNewPosts=${CHECK_INTERVAL}m reloadTabs=${RELOAD_INTERVAL}m`);
}


chrome.runtime.onInstalled.addListener(() => {
  console.log('Company Post Liker extension installed');

  ensureAlarms();
  loadCustomPagesFromStorage();

  chrome.storage.local.get(['fbPages', 'liPages', 'lastLiked'], (result) => {
    const defaults = {};
    if (!result.fbPages) defaults.fbPages = FB_PAGES.join(', ');
    if (!result.liPages) defaults.liPages = LI_PAGES.join(', ');
    if (typeof result.lastLiked === 'undefined') defaults.lastLiked = null;

    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Company Post Liker service worker startup');
  ensureAlarms();
  loadCustomPagesFromStorage();
});

// Immediately load at first initialization as service worker starts
loadCustomPagesFromStorage();

// Listen for storage changes from popup and update custom pages
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.fbPages) {
      customFbPages = Array.isArray(changes.fbPages.newValue)
        ? changes.fbPages.newValue
        : changes.fbPages.newValue.split(',').map(s => s.trim()).filter(Boolean);
      console.log('Updated custom FB pages:', customFbPages);
    }
    if (changes.liPages) {
      customLiPages = Array.isArray(changes.liPages.newValue)
        ? changes.liPages.newValue
        : changes.liPages.newValue.split(',').map(s => s.trim()).filter(Boolean);
      console.log('Updated custom LI pages:', customLiPages);
    }

    // Immediately reload and check after updating the settings
    reloadBackgroundTabs();
    setTimeout(() => {
      checkForNewPosts();
    }, 1200);
  }
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkNewPosts') {
    console.log('Checking for new posts...');
    checkForNewPosts();
  }
  
  if (alarm.name === 'reloadTabs') {
    console.log(' Reloading background tabs to fetch fresh content...');
    reloadBackgroundTabs();
  }
});

// Reload all target tabs (even background ones)
function reloadBackgroundTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (isTargetPage(tab.url)) {
        const now = Date.now();
        const lastReload = lastReloadTimes[tab.id] || 0;
        
        // Only reload if 5+ minutes have passed since last reload
        if (now - lastReload > RELOAD_INTERVAL * 60 * 1000) {
          console.log(` Reloading tab ${tab.id}: ${tab.url}`);
          chrome.tabs.reload(tab.id);
          lastReloadTimes[tab.id] = now;
        }
      }
    });
  });
}

function checkForNewPosts() {
  // Get all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      // Check if tab is on our target pages (doesn't matter if active or not)
      if (isTargetPage(tab.url)) {
        console.log(` Sending like command to tab ${tab.id}: ${tab.url}`);
        
        // Send message to content script to like posts
        chrome.tabs.sendMessage(tab.id, 
          { action: 'likeNewPosts' }, 
          (response) => {
            if (chrome.runtime.lastError) {
              console.log(` Tab ${tab.id} not ready: ${chrome.runtime.lastError.message}`);
              return;
            }
            
            if (response && response.success) {
              console.log(` Liked posts on tab ${tab.id}: ${response.count} new posts`);
              // Update last liked time
              chrome.storage.local.set({
                lastLiked: new Date().toISOString()
              });
            }
          }
        );
      }
    });
  });
}

function getLinkedInCompanyFromUrl(url) {
  const match = url.match(/linkedin\.com\/company\/([^\/?#]+)/i);
  return match ? match[1].toLowerCase() : null;
}

function isTargetPage(url) {
  if (!url) return false;

  const normalizedUrl = url.toLowerCase();

  // Facebook pages
  if (normalizedUrl.includes('facebook.com')) {
    return customFbPages.some(id => id && normalizedUrl.includes(id.toLowerCase()));
  }

  // LinkedIn company pages
  if (normalizedUrl.includes('linkedin.com')) {
    const company = getLinkedInCompanyFromUrl(normalizedUrl);
    if (company) {
      return customLiPages.some(handle => handle && handle.toLowerCase() === company);
    }
    // fallback: direct substring check if URL contains /company/<handle>
    return customLiPages.some(handle => handle && normalizedUrl.includes(`/company/${handle.toLowerCase()}`));
  }

  // Instagram accounts
  if (normalizedUrl.includes('instagram.com')) {
    return normalizedUrl.includes('/zaavia/') || normalizedUrl.includes('/saerintech/');
  }

  return false;
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    chrome.storage.local.get(['lastLiked'], (result) => {
      sendResponse({
        lastLiked: result.lastLiked || null,
        status: 'active'
      });
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'manualLike') {
    // Manually trigger likes on all open tabs
    console.log('🖱️ Manual like triggered');
    reloadBackgroundTabs();
    setTimeout(() => checkForNewPosts(), 2000);
    sendResponse({ success: true });
    return true;
  }
});

// Track when tabs are created to know about them
chrome.tabs.onCreated.addListener((tab) => {
  console.log(`📋 New tab created: ${tab.url}`);
});

// Clean up tracking when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete lastReloadTimes[tabId];
});

console.log('Company Post Liker background service worker started');
