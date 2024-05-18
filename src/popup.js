// Check the current window and api key
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  // Check if there are any active tabs
  if (tabs.length === 0) {
    console.error('No active tab found');
    return;
  }

  const currentTab = tabs[0];

  // Use startsWith for URL pattern matching
  if (currentTab.url.startsWith('https://onlyfans.com/my/chats/') && currentTab.status === 'complete') {
    // User is on the specific URL, show chat interface
    console.log('User is on the specific URL');
    document.getElementById('loginMessage').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'block';

    // Check if apiKey is set
    chrome.storage.local.get(['apiKey'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Error retrieving API key:', chrome.runtime.lastError);
        return;
      }

      const apiKey = result.apiKey;
      if (apiKey) {
        console.log('API key retrieved');
        // Get messages
        refreshMessages();
      } else {
        console.log('API key not found.');
        document.getElementById('keyMessage').style.display = 'block';
        document.getElementById('chatInterface').style.display = 'none';
      }
    });
  } else {
    console.log('User is not on the specific URL');
    // User is not on the specific URL, show login message
    document.getElementById('loginMessage').style.display = 'block';
    document.getElementById('chatInterface').style.display = 'none';
  }
});



// Function to check if the key is accepted
function checkKey(key) {
  chrome.storage.local.clear();
  const requestBody = { key: key };
  console.log('Checking key:', JSON.stringify(requestBody));
  // Define the URL of your Vercel serverless function
  const serverlessFunctionURL = 'https://ovai.gemforce.host/users/operator-auth'; // Replace with the actual URL
  // Create a request body with the key
  console.log('requestBody: ', requestBody);
  // Make a POST request to the serverless function
  fetch(serverlessFunctionURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => {
      if (response.status === 200) {
        // Send the API key to the background script
        chrome.runtime.sendMessage({ key: key });
        console.log('API key entered:', key);
        // Refresh the webpage
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          const currentTab = tabs[0];
          console.log('Reloading tab:', currentTab);
          chrome.tabs.reload(currentTab.id);
        // Close the extension popup after a delay to set API
        setTimeout(() => {
          const popupWindow = chrome.extension.getViews({ type: "popup" })[0];
          popupWindow.close();
        }, 500);
        });
      } else if (response.status === 401) {
        console.log('Key unauthorized');
        alert('Key not found.');
        return;
      } else {
        // Handle other response statuses as needed
        console.log('An error occurred');
        return;
      }
    })
    .catch((error) => {
      // Handle network or request errors
      console.error('Error:', error);
    });
}

// Event listener for the api input button
document.getElementById('storeApiKey').addEventListener('click', function() {
  try {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKey = apiKeyInput.value;
    console.log('API key entered:', apiKey);
    checkKey(apiKey);
  } catch (error) {
    console.error('Error in storeApiKey click handler:', error);
  }
});


// Function to retrieve messages from local storage and update the popup interface
function getMessagesFromStorage() {
  chrome.storage.local.get(['messages'], function(result) {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving messages:', chrome.runtime.lastError.message);
      return;
    }
    const messages = result.messages || []; // Default to an empty array if messages are not found
    console.log('Messages from storage:', messages);

    // Update the popup interface with the data from messages
    for (let i = 0; i < 5; i++) {
      const messageInput = document.getElementById(`message${i}`);
      const selectMessage = document.getElementById(`selectMessage${i}`);
      if (i < messages.length) {
        messageInput.value = messages[i];
        selectMessage.style.display = 'inline-block';
      } else {
        messageInput.value = '';
        selectMessage.style.display = 'none'; // Hide the radio button
      }
    }
  });
}

// Function to refresh messages
function refreshMessages() {
  console.log('Message sent to content.js to refresh messages');
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshMessages' });
  });
}

// Event listener for the refresh page button
document.getElementById('refreshMessages').addEventListener('click', function() {
  // Refresh the webpage
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    console.log('Reloading tab:', currentTab);
    chrome.tabs.reload(currentTab.id);
  });
  // Close the extension popup after a delay of 500 milliseconds (half a second)
  setTimeout(() => {
    const popupWindow = chrome.extension.getViews({ type: "popup" })[0];
    popupWindow.close();
  }, 500);
});


// Function to send the message to LLM
function sendToLLM(selectedMessage) {
  if (selectedMessage) {
    // Send the message to the content script to get the LLM response
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'sendResponse', message: selectedMessage });
    });
    animateDots();
  } else {
    alert('Select one of the messages or enter your own.');
  }
}

// Event listener for the send manual message button
document.getElementById('selectMessage').addEventListener('click', function() {
  let selectedMessage = document.getElementById('manualMessage').value;
  console.log('Manual message:', selectedMessage);
  sendToLLM(selectedMessage);
});

// Grab the checked message
function getFirstCheckedMessage() {
  for (let i = 0; i <= 4; i++) {
    if (document.getElementById(`selectMessage${i}`).checked) {
      return document.getElementById(`message${i}`).value;
    }
  }
}

// Event listener for the send selected button
document.getElementById('sendToBot').addEventListener('click', function() {
  let selectedMessage = getFirstCheckedMessage();
  console.log('Selected message:', selectedMessage);
  sendToLLM(selectedMessage);
});

// Event listener for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'sendMessageResponse') {
    // Handle the LLM response in your popup.js
    const messages = request.messages;
    // update html
    console.log('Received messages in popup.js:', messages);
    getMessagesFromStorage()
  }
});

// Event listener sending messages from the background script to LLM
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'sendLLMResponse') {
    // Handle the LLM response in your popup.js
    const llmResponse = request.response;
    // update html
    console.log('Received LLM response in popup.js:', llmResponse);
    document.getElementById('llmResponse').value = llmResponse;
  }
});

// JavaScript to refresh messages button click event
document.getElementById('refreshButton').addEventListener('click', function() {
  // Add the "clicked" class to initiate the spinning animation
  this.classList.add('clicked');
  // Perform the reload action here
  console.log('Reload button clicked');
  refreshMessages();
  // Remove the "clicked" class after the animation completes
  const button = this;
  button.addEventListener('animationend', function() {
    button.classList.remove('clicked');
  }, { once: true });
});

// function to animate 'Response' dots
function animateDots() {
  const dots = document.querySelectorAll('.dot');
  let index = 0;
  // Animate each dot in sequence
  function animateNextDot() {
    if (index < dots.length) {
      // Hide the previous dot (if any)
      if (index > 0) {
        dots[index - 1].style.opacity = '0';
      }
      // Show the current dot
      dots[index].style.opacity = '1';
      index++;
      // Check if this is the last dot and hide it after a delay
      if (index === dots.length) {
        setTimeout(function() {
          dots[dots.length - 1].style.opacity = '0';
        }, 1000); // Adjust the delay as needed
      } else {
        setTimeout(animateNextDot, 1000); // Adjust the duration between dot animations
      }
    }
  }
  animateNextDot();
}

// send answer next to content messages
function setLatest(response) {
  try {
    console.log('Response sent to content.js to set latest messages');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      if (tabs.length === 0) {
        throw new Error("No active tab found");
      }
      chrome.tabs.sendMessage(tabs[0].id, { action: 'setLatest', response: response });
    });
  } catch (error) {
    console.error('Error in setLatest:', error);
  }
}

// Event listener for the answer next button
document.getElementById('answerNext').addEventListener('click', function() {
  try {
    let responseElement = document.getElementById('llmResponse');
    if (!responseElement) {
      throw new Error('llmResponse element not found');
    }
    let response = responseElement.value;
    setLatest(response);
  } catch (error) {
    console.error('Error in answerNext click handler:', error);
  }
});
