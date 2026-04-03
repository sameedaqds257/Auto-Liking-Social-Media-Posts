// Company page IDs
const COMPANY_PAGE_ID = ["61573834194646", "zaavia.net"];

// LinkedIn company pages
const LI_PAGES = ["saerintechllc", "zaavia"];

// Instagram company accounts
const IG_ACCOUNTS = ["zaavia", "saerintech"];

// Load custom pages from storage
let customCompanyPages = COMPANY_PAGE_ID;
let customLiPages = LI_PAGES;

function initializeAndCheckPage() {
  chrome.storage.local.get(['fbPages', 'liPages'], (result) => {
    if (result.fbPages) {
      customCompanyPages = Array.isArray(result.fbPages)
        ? result.fbPages
        : result.fbPages.split(',').map(s => s.trim());
    }
    if (result.liPages) {
      customLiPages = Array.isArray(result.liPages)
        ? result.liPages
        : result.liPages.split(',').map(s => s.trim());
    }
    
    console.log('Custom FB pages:', customCompanyPages);
    console.log('Custom LI pages:', customLiPages);
    console.log('Current URL:', window.location.href);
    
    if (isCompanyPage() || isLinkedInPage() || isInstagramPage()) {
      // Wait for page to fully load
      setTimeout(() => {
        likeLatestPost();
      }, 4000);
    }
  });
}

// Initialize on page load
initializeAndCheckPage();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.fbPages || changes.liPages) {
      console.log('Storage changed, reinitializing...');
      initializeAndCheckPage();
    }
  }
});

function isCompanyPage() {
  return customCompanyPages.some(id => window.location.href.includes(id));
}

function getLinkedInCompanyFromUrl(url) {
  const match = url.match(/linkedin\.com\/company\/([^\/?#]+)/i);
  return match ? match[1].toLowerCase() : null;
}

function isLinkedInPage() {
  if (!window.location.hostname.includes("linkedin.com")) return false;
  const company = getLinkedInCompanyFromUrl(window.location.href);
  if (!company) return false;
  return customLiPages.some(page => page && page.toLowerCase() === company);
}

function isInstagramPage() {
  return window.location.hostname.includes("instagram.com") && 
         IG_ACCOUNTS.some(account => window.location.href.includes(`/${account}/`));
}

function likeLatestPost() {
  let likeButton;
  
  console.log("=== Starting likeLatestPost ===");
  console.log("Page hostname:", window.location.hostname);
  console.log("Page URL:", window.location.href);
  
  // Check which platform we're on
  if (isInstagramPage()) {
    console.log("Detected Instagram page");
    likeButton = findInstagramLikeButton();
  } else if (isLinkedInPage()) {
    console.log("Detected LinkedIn page");
    // Scroll to ensure content is loaded
    window.scrollBy(0, 500);
    setTimeout(() => {
      likeButton = findLinkedInLikeButton();
      processLikeButton(likeButton);
    }, 1000);
    return; // Exit early for LinkedIn since we're using setTimeout
  } else {
    // Original company page logic
    console.log("Detected Facebook company page");
    likeButton = findCompanyPageLikeButton();
  }
  
  processLikeButton(likeButton);
}

function processLikeButton(likeButton) {
  if (likeButton) {
    console.log("Like button found:", likeButton);
    console.log("Button aria-label:", likeButton.getAttribute('aria-label'));
    console.log("Button classes:", likeButton.className);
    
    // Check if already liked
    const isAlreadyLiked = likeButton.getAttribute('aria-pressed') === 'true' ||
                          likeButton.classList.contains('artdeco-button--active') ||
                          likeButton.getAttribute('aria-label')?.includes('Unlike');
    
    if (!isAlreadyLiked) {
      // Add a small random delay to mimic human behavior (0.5-1.5 seconds)
      const randomDelay = Math.floor(Math.random() * 1000) + 500;
      
      setTimeout(() => {
        try {
          likeButton.click();
          console.log("✅ Post liked successfully!");
          
          // Store the fact that we liked this post
          chrome.storage.local.set({ 
            lastLiked: new Date().toISOString() 
          });
        } catch (e) {
          console.error("Error clicking like button:", e);
        }
      }, randomDelay);
      
    } else {
      console.log("Post already liked!");
    }
  } else {
    console.log("❌ No like button found on this page");
  }
}

function findCompanyPageLikeButton() {
  // Find all Like buttons on the company page
  const likeButtons = document.querySelectorAll('[aria-label="Like"]');
  
  if (likeButtons.length > 0) {
    return likeButtons[0]; // Return first post's like button
  }
  
  return null;
}

function findLinkedInLikeButton() {
  console.log("🔍 Searching for LinkedIn like button...");
  
  // Strategy 1: Look for buttons in the feed with aria-label containing "Like"
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log(`Total buttons found on page: ${allButtons.length}`);
  
  // Filter to find like buttons
  const likeButtons = allButtons.filter(btn => {
    const ariaLabel = btn.getAttribute('aria-label') || '';
    return ariaLabel.toLowerCase().includes('like') && 
           ariaLabel.toLowerCase() !== 'unlike reactions' &&
           btn.offsetParent !== null; // visible button
  });
  
  console.log(`Found ${likeButtons.length} potential like buttons:`, 
    likeButtons.map(b => b.getAttribute('aria-label')));
  
  if (likeButtons.length > 0) {
    // Get the first visible like button that hasn't been liked yet
    for (let button of likeButtons) {
      const label = button.getAttribute('aria-label').toLowerCase();
      // Skip "unlikes" - we only want buttons that say "Like"
      if (label === 'like' || (label.includes('like') && !label.includes('unlike'))) {
        console.log("✓ Found LinkedIn like button with aria-label:", label);
        return button;
      }
    }
  }
  
  // Strategy 2: Look for specific LinkedIn UI structure with role
  const socialLikeBtn = Array.from(document.querySelectorAll('[role="button"]')).find(btn => {
    const label = btn.getAttribute('aria-label') || '';
    return label.toLowerCase() === 'like';
  });
  
  if (socialLikeBtn) {
    console.log("✓ Found LinkedIn like button via role=button");
    return socialLikeBtn;
  }
  
  // Strategy 3: Look for data-test-id selector (LinkedIn internal)
  const testIdBtn = document.querySelector('[data-test-id*="like"]');
  if (testIdBtn) {
    console.log("✓ Found LinkedIn like button via data-test-id");
    return testIdBtn;
  }
  
  console.log("❌ LinkedIn like button not found after 3 strategies");
  console.log("Sample button labels found:", allButtons.slice(0, 10).map(b => b.getAttribute('aria-label')));
  
  return null;
}

function findInstagramLikeButton() {
  // Instagram like button - try multiple selector strategies
  
  // Strategy 1: Look for the heart icon button in first post
  const posts = document.querySelectorAll('[role="article"]');
  
  if (posts.length > 0) {
    const firstPost = posts[0];
    
    // Instagram uses specific button structure for likes
    // Look for button with aria-label containing "Like"
    const buttons = firstPost.querySelectorAll('button');
    
    for (let button of buttons) {
      const ariaLabel = button.getAttribute('aria-label') || '';
      
      // Instagram uses "Like" or "Unlike" text
      if (ariaLabel.includes('Like')) {
        console.log("Found Instagram like button, aria-label:", ariaLabel);
        return button;
      }
    }
  }
  
  // Strategy 2: Global search for Like buttons
  const allLikeButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const label = btn.getAttribute('aria-label') || '';
    return label.includes('Like');
  });
  
  if (allLikeButtons.length > 0) {
    console.log("Found Instagram like button via global search, total buttons:", allLikeButtons.length);
    return allLikeButtons[0];
  }
  
  console.log("Instagram like button not found");
  console.log("Total buttons on page:", document.querySelectorAll('button').length);
  
  return null;
}