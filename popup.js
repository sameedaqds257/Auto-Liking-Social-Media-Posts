let fbPages = [];
let liPages = [];

// Load existing settings
chrome.storage.local.get(['fbPages', 'liPages'], (result) => {
  fbPages = result.fbPages ? result.fbPages.split(',').map(s => s.trim()).filter(s => s) : [];
  liPages = result.liPages ? result.liPages.split(',').map(s => s.trim()).filter(s => s) : [];

  renderFbList();
  renderLiList();
  updateCurrentDisplay();
});

// Load last liked
chrome.storage.local.get(['lastLiked'], (result) => {
  const statsDiv = document.getElementById('stats');
  if (result.lastLiked) {
    const likedDate = new Date(result.lastLiked);
    statsDiv.innerHTML =
      `Last liked:<br>${likedDate.toLocaleString()}`;
  } else {
    statsDiv.innerHTML = '⏱️ No posts liked yet';
  }
});

// Add FB page
document.getElementById('fb-add-btn').addEventListener('click', () => {
  const newPage = document.getElementById('fb-add').value.trim();
  if (newPage && !fbPages.includes(newPage)) {
    fbPages.push(newPage);
    document.getElementById('fb-add').value = '';
    renderFbList();
    updateCurrentDisplay();
  }
});

// Add LI company
document.getElementById('li-add-btn').addEventListener('click', () => {
  const newCompany = document.getElementById('li-add').value.trim();
  if (newCompany && !liPages.includes(newCompany)) {
    liPages.push(newCompany);
    document.getElementById('li-add').value = '';
    renderLiList();
    updateCurrentDisplay();
  }
});

// Save all settings
document.getElementById('save-settings').addEventListener('click', () => {
  const fbString = fbPages.join(', ');
  const liString = liPages.join(', ');

  chrome.storage.local.set({
    fbPages: fbString,
    liPages: liString
  }, () => {
    document.getElementById('save-message').style.display = 'block';

    // Trigger immediate check+reload in background after saving
    chrome.runtime.sendMessage({ action: 'manualLike' }, (response) => {
      console.log('manualLike response:', response);
    });

    setTimeout(() => {
      document.getElementById('save-message').style.display = 'none';
    }, 2000);
  });
});

function renderFbList() {
  const list = document.getElementById('fb-list');
  list.innerHTML = '';

  fbPages.forEach((page, index) => {
    const item = document.createElement('div');
    item.className = 'page-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = page;
    input.addEventListener('change', (e) => {
      fbPages[index] = e.target.value.trim();
      updateCurrentDisplay();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '-';
    deleteBtn.title = 'Remove this page';
    deleteBtn.addEventListener('click', () => {
      fbPages.splice(index, 1);
      renderFbList();
      updateCurrentDisplay();
    });

    item.appendChild(input);
    item.appendChild(deleteBtn);
    list.appendChild(item);
  });
}

function renderLiList() {
  const list = document.getElementById('li-list');
  list.innerHTML = '';

  liPages.forEach((company, index) => {
    const item = document.createElement('div');
    item.className = 'page-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = company;
    input.addEventListener('change', (e) => {
      liPages[index] = e.target.value.trim();
      updateCurrentDisplay();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '-';
    deleteBtn.title = 'Remove this company';
    deleteBtn.addEventListener('click', () => {
      liPages.splice(index, 1);
      renderLiList();
      updateCurrentDisplay();
    });

    item.appendChild(input);
    item.appendChild(deleteBtn);
    list.appendChild(item);
  });
}

function updateCurrentDisplay() {
  const fbDisplay = fbPages.length > 0 ? `Pages: ${fbPages.join(', ')}` : 'No Facebook pages configured';
  const liDisplay = liPages.length > 0 ? `Companies: ${liPages.join(', ')}` : 'No LinkedIn companies configured';

  document.getElementById('fb-current').textContent = fbDisplay;
  document.getElementById('li-current').textContent = liDisplay;
}