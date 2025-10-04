let enabled = false;
let hostRegex = null;
let headers = {};

// Load configuration on startup
loadConfig();

function loadConfig() {
  browser.storage.local.get(['enabled', 'config']).then(result => {
    enabled = result.enabled || false;
    
    if (result.config) {
      try {
        const config = JSON.parse(result.config);
        hostRegex = new RegExp(config.host_regex);
        headers = config.headers || {};
      } catch (e) {
        console.error('Failed to parse config:', e);
        hostRegex = null;
        headers = {};
      }
    } else {
      hostRegex = null;
      headers = {};
    }
    
    updateListener();
  });
}

// Listen for messages from popup
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleExtension') {
    enabled = message.enabled;
    updateListener();
  } else if (message.action === 'configUpdated') {
    loadConfig();
  }
});

function updateListener() {
  // Remove existing listener
  if (browser.webRequest.onBeforeSendHeaders.hasListener(modifyHeaders)) {
    browser.webRequest.onBeforeSendHeaders.removeListener(modifyHeaders);
  }
  
  // Add listener if enabled and config is valid
  if (enabled && hostRegex && Object.keys(headers).length > 0) {
    browser.webRequest.onBeforeSendHeaders.addListener(
      modifyHeaders,
      { urls: ["<all_urls>"] },
      ["blocking", "requestHeaders"]
    );
  }
}

function modifyHeaders(details) {
  // Extract hostname from URL
  let hostname;
  try {
    hostname = new URL(details.url).hostname;
  } catch (e) {
    return {};
  }
  
  // Check if hostname matches the regex
  if (!hostRegex.test(hostname)) {
    return {};
  }
  
  // Add custom headers
  for (const [name, value] of Object.entries(headers)) {
    // Remove existing header with same name (case-insensitive)
    details.requestHeaders = details.requestHeaders.filter(
      h => h.name.toLowerCase() !== name.toLowerCase()
    );
    
    // Add new header
    details.requestHeaders.push({
      name: name,
      value: String(value)
    });
  }
  
  return { requestHeaders: details.requestHeaders };
}
