
document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  chrome.storage.sync.get(['apiKey', 'apiUrl'], (config) => {
    if (config.apiUrl) apiUrlInput.value = config.apiUrl;
    if (config.apiKey) apiKeyInput.value = config.apiKey;
  });

  saveBtn.addEventListener('click', () => {
    const apiUrl = apiUrlInput.value.trim().replace(/\/$/, '');
    const apiKey = apiKeyInput.value.trim();

    if (!apiUrl) {
      status.textContent = 'Please enter your dashboard URL.';
      status.className = 'status error';
      return;
    }

    if (!apiKey) {
      status.textContent = 'Please enter your API key.';
      status.className = 'status error';
      return;
    }

    chrome.storage.sync.set({ apiUrl, apiKey }, () => {
      status.textContent = '✓ Settings saved!';
      status.className = 'status';
      setTimeout(() => { status.textContent = ''; }, 2500);
    });
  });
});
