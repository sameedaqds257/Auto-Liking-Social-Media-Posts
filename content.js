// Company page IDs
const COMPANY_PAGE_ID = ["61573834194646", "zaavia.net"];

// LinkedIn company pages
const LI_PAGES = ["saerintechllc", "zaavia"];

// Instagram company accounts
const IG_ACCOUNTS = ["zaavia", "saerintech"];

function isCompanyPage() {
  return COMPANY_PAGE_ID.some(id => window.location.href.includes(id));
}

function isLinkedInPage() {
  return window.location.hostname.includes("linkedin.com") && 
         LI_PAGES.some(page => window.location.href.includes(`/company/${page}`));
}

function isInstagramPage() {
  return window.location.hostname.includes("instagram.com") && 
         IG_ACCOUNTS.some(account => window.location.href.includes(`/${account}/`));
}

if (isCompanyPage() || isLinkedInPage() || isInstagramPage()) {
  // Wait for page to fully load
  setTimeout(() => {
    likeLatestPost();
  }, 4000);
}

function likeLatestPost() {
  let likeButton;
  
  // Check which platform we're on
  if (isInstagramPage()) {
    console.log("Detected Instagram page");
    likeButton = findInstagramLikeButton();
  } else if (isLinkedInPage()) {
    console.log("Detected LinkedIn page");
    likeButton = findLinkedInLikeButton();
  } else {
    // Original company page logic
    console.log("Detected Facebook company page");
    likeButton = findCompanyPageLikeButton();
  }
  
  if (likeButton) {
    console.log("Like button found:", likeButton);
    
    // Check if already liked
    const isAlreadyLiked = likeButton.getAttribute('aria-pressed') === 'true' ||
                          likeButton.classList.contains('artdeco-button--active') ||
                          likeButton.getAttribute('aria-label')?.includes('Unlike');
    
    if (!isAlreadyLiked) {
      // Add a small random delay to mimic human behavior (1-3 seconds)
      const randomDelay = Math.floor(Math.random() * 2000) + 1000;
      
      setTimeout(() => {
        likeButton.click();
        console.log("Post liked successfully!");
        
        // Store the fact that we liked this post
        chrome.storage.local.set({ 
          lastLiked: new Date().toISOString() 
        });
      }, randomDelay);
      
    } else {
      console.log("Post already liked!");
    }
  } else {
    console.log("No like button found on this page");
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
  // LinkedIn like button selectors (update based on LinkedIn's current structure)
  const likeButtons = document.querySelectorAll('[aria-label*="Like"]');
  
  if (likeButtons.length > 0) {
    // Filter for actual like buttons (not comment, share, etc.)
    for (let button of likeButtons) {
      if (button.getAttribute('aria-label').toLowerCase().includes('like')) {
        return button;
      }
    }
  }
  
  // Alternative LinkedIn selector
  const altButton = document.querySelector('[data-test-id="social-like-icon"]');
  if (altButton) {
    return altButton;
  }
  
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