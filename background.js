
// // Set up alarm to check periodically
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.alarms.create("checkNewPost", {
//     periodInMinutes: CHECK_INTERVAL
//   });
//   console.log("Company Post Liker installed!");
// });

// // When alarm fires, open company pages
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === "checkNewPost") {
    
//     // Open Facebook pages
//     FB_PAGES.forEach(pageId => {
//       chrome.tabs.create({
//         url: `https://www.facebook.com/${pageId}`,
//         active: false
//       }, (tab) => {
//         setTimeout(() => chrome.tabs.remove(tab.id), 15000);
//       });
//     });

//     // Open LinkedIn pages
//     LI_PAGES.forEach(pageUrl => {
//       chrome.tabs.create({
//         url: `https://www.linkedin.com/company/${pageUrl}/posts`,
//         active: false
//       }, (tab) => {
//         setTimeout(() => chrome.tabs.remove(tab.id), 15000);
//       });
//     });

//   }
// });



// ----------------------------------------------------------------------


// const FB_PAGES = ["61573834194646", "zaavia.net"];
// const LI_PAGES = ["saerintechllc", "zaavia"];
// const CHECK_INTERVAL = 1; // in minutes

// // Set up alarm to check for new posts every 30 minutes
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.alarms.create('checkNewPosts', { periodInMinutes: 1 });
//   console.log('Company Post Liker extension installed');
// });

// // Listen for alarm
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'checkNewPosts') {
//     console.log('Checking for new posts...');
//     checkForNewPosts();
//   }
// });

// function checkForNewPosts() {
//   // Get all tabs
//   chrome.tabs.query({}, (tabs) => {
//     tabs.forEach((tab) => {
//       // Check if tab is on our target pages
//       if (isTargetPage(tab.url)) {
//         // Reload the tab to fetch the latest posts
//         chrome.tabs.reload(tab.id);
//       }
//     });
//   });
// }

// function isTargetPage(url) {
//   // Facebook pages
//   if (url.includes('facebook.com') && 
//       (url.includes('zaavia.net') || url.includes('61573834194646'))) {
//     return true;
//   }
  
//   // LinkedIn company pages
//   if (url.includes('linkedin.com') && 
//       (url.includes('/company/saerintechllc') || url.includes('/company/zaavia'))) {
//     return true;
//   }
  
//   // Instagram accounts
//   if (url.includes('instagram.com') && 
//       (url.includes('/zaavia/') || url.includes('/saerintech/'))) {
//     return true;
//   }
  
//   return false;
// }

// function triggerPostLike() {
//   // This function runs in the context of the page
//   // It triggers the likeLatestPost function from content.js
//   if (typeof likeLatestPost !== 'undefined') {
//     likeLatestPost();
//   }
// }

// // Listen for messages from popup
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'getStatus') {
//     chrome.storage.local.get(['lastLiked'], (result) => {
//       sendResponse({
//         lastLiked: result.lastLiked || null
//       });
//     });
//     return true; // Will respond asynchronously
//   }
// });

// // Log when the extension starts
// console.log('Company Post Liker background service worker started');


// ----------------------------------------------------------


const FB_PAGES = ["61573834194646", "zaavia.net"];
const LI_PAGES = ["saerintechllc", "zaavia"];
const CHECK_INTERVAL = 120; // in minutes
const RELOAD_INTERVAL = 120; // reload every 5 minutes

let lastReloadTimes = {}; // Track reload times per tab

// Set up alarm to check for new posts every X minutes
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('checkNewPosts', { periodInMinutes: CHECK_INTERVAL });
  chrome.alarms.create('reloadTabs', { periodInMinutes: RELOAD_INTERVAL });
  console.log('Company Post Liker extension installed');
  
  // Store config in storage for content scripts to access
  chrome.storage.local.set({
    fbPages: FB_PAGES,
    liPages: LI_PAGES,
    lastLiked: null
  });
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

function isTargetPage(url) {
  if (!url) return false;
  
  // Facebook pages
  if (url.includes('facebook.com')) {
    if (url.includes('zaavia.net') || url.includes('61573834194646')) {
      return true;
    }
  }
  
  // LinkedIn company pages
  if (url.includes('linkedin.com')) {
    if (url.includes('/company/saerintechllc') || url.includes('/company/zaavia')) {
      return true;
    }
  }
  
  // Instagram accounts
  if (url.includes('instagram.com')) {
    if (url.includes('/zaavia/') || url.includes('/saerintech/')) {
      return true;
    }
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

console.log('✅ Company Post Liker background service worker started');