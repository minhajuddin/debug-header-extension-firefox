// Load current state
browser.storage.local.get(['enabled', 'config']).then(result => {
  const enabled = result.enabled || false;
  const config = result.config || '';
  
  updateToggleButton(enabled);
  document.getElementById('config').value = config;
});

// Toggle button
document.getElementById('toggleBtn').addEventListener('click', () => {
  browser.storage.local.get(['enabled']).then(result => {
    const newState = !result.enabled;
    browser.storage.local.set({ enabled: newState }).then(() => {
      updateToggleButton(newState);
      // Notify background script
      browser.runtime.sendMessage({ action: 'toggleExtension', enabled: newState });
    });
  });
});

// Save button
document.getElementById('saveBtn').addEventListener('click', () => {
  const configText = document.getElementById('config').value.trim();
  
  if (!configText) {
    showMessage('Configuration saved (empty)', 'success');
    browser.storage.local.set({ config: '' }).then(() => {
      browser.runtime.sendMessage({ action: 'configUpdated' });
    });
    return;
  }
  
  try {
    const parsed = JSON.parse(configText);
    
    // Validate structure
    if (!parsed.host_regex || !parsed.headers) {
      showMessage('Error: Config must have "host_regex" and "headers" fields', 'error');
      return;
    }
    
    // Test regex validity
    try {
      new RegExp(parsed.host_regex);
    } catch (e) {
      showMessage('Error: Invalid regex pattern', 'error');
      return;
    }
    
    // Validate headers is an object
    if (typeof parsed.headers !== 'object' || Array.isArray(parsed.headers)) {
      showMessage('Error: "headers" must be an object', 'error');
      return;
    }
    
    browser.storage.local.set({ config: configText }).then(() => {
      showMessage('Configuration saved successfully!', 'success');
      browser.runtime.sendMessage({ action: 'configUpdated' });
    });
    
  } catch (e) {
    showMessage('Error: Invalid JSON - ' + e.message, 'error');
  }
});

// Clear button
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('config').value = '';
  browser.storage.local.set({ config: '' }).then(() => {
    showMessage('Configuration cleared', 'success');
    browser.runtime.sendMessage({ action: 'configUpdated' });
  });
});

function updateToggleButton(enabled) {
  const btn = document.getElementById('toggleBtn');
  const status = document.getElementById('status');
  
  if (enabled) {
    btn.classList.remove('disabled');
    btn.classList.add('enabled');
    btn.textContent = 'Enabled';
    status.textContent = 'Extension is active';
  } else {
    btn.classList.remove('enabled');
    btn.classList.add('disabled');
    btn.textContent = 'Disabled';
    status.textContent = 'Extension is disabled';
  }
}

function showMessage(text, type) {
  const msg = document.getElementById('message');
  msg.textContent = text;
  msg.className = 'message ' + type;
  msg.style.display = 'block';
  
  setTimeout(() => {
    msg.style.display = 'none';
  }, 3000);
}
