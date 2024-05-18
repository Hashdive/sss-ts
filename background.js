// hold messages and response
let messages = [];
let response = '';

// Store the API key in local storage
function storeApiKey(apiKey) {
  chrome.storage.local.set({ apiKey: apiKey }, function() {
    if (chrome.runtime.lastError) {
      console.error('Error storing API key:', chrome.runtime.lastError.message);
      return;
    }
    console.log('API key has been stored:', apiKey);
  });
}

// Listener for the apiKey
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.key) {
    // If a message contains the API key, store it
    storeApiKey(request.key);
  }
});

// Listener for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  try {
    if (request.action === "updateInterface") {
      // Clear existing messages and update with new ones
      messages = request.messages || [];
      console.log('Messages:', messages);
      chrome.storage.local.set({ messages: messages }, function() {
        if (chrome.runtime.lastError) {
          console.error('Error saving messages:', chrome.runtime.lastError.message);
        }
      });
      chrome.runtime.sendMessage({ action: 'sendMessageResponse', messages: messages });
    } else if (request.action === "updateLLM") {
      response = request.response;
      console.log('Response:', response);
      chrome.storage.local.set({ response: response }, function() {
        if (chrome.runtime.lastError) {
          console.error('Error saving response:', chrome.runtime.lastError.message);
        }
      });
      chrome.runtime.sendMessage({ action: 'sendLLMResponse', response: response });
      sendResponse({ messages: messages, response: response });
    }
  } catch (error) {
    console.error('Error in onMessage listener:', error);
  }
});
