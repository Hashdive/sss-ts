// Function to send message to LLM and get a response
async function getLLMResponse(message, history) {

  try {
    // Define the conversation data to send to the serverless function
    const conversationData = {
      inputs: message,
    };

    // Set the URL of your deployed serverless function.
    const functionUrl = 'https://ovai.gemforce.host/users/call-persona'; // Replace with your actual URL.

    // Retrieve the stored API key
    chrome.storage.local.get(['apiKey'], async function(result) {
      const apiKey = result.apiKey;
      console.log('API key retrieved:', apiKey);
      // Check if an API key is available
      if (apiKey) {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Handler-Class': 'plugin', 
            'Access-Control-Allow-Origin': 'https://www.onlyfans.com',
          },
          body: JSON.stringify(conversationData),
        });

        if (!response.ok) {
          throw new Error('Request to serverless function failed');
        }

        const data = await response.json();
        const split = data.split('<|model|>');
        console.log(split[split.length - 1]);
        const cleanedUpResponse = cleanResponse(split[split.length - 1]);
        console.log('cleaned up response: ', cleanedUpResponse);
        // Assuming you have an `updateLLM` function defined to handle the response
        updateLLM(cleanedUpResponse);
        return true; // Required to allow async sendResponse
      } else {
        console.error('No API key available. Please enter your API key.');
        return false; // Return false if there's no API key
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return false; // Return false in case of an error
  }
}

function cleanResponse(text) {
  const sentences = text.match(/[^.!?]+[.!?(.")(!")(?")]+/g); // Split the text into sentences
  if (!sentences || sentences.length === 0) {
    // Handle cases with no complete sentences
    return text;
  }
  // Ensure the last sentence is complete and remove incomplete ones
  while (sentences.length > 3 || (sentences.length > 0 && !/[.!?]$/.test(sentences[sentences.length - 1]))) {
    sentences.pop();
  }
  const uniqueSentences = [];
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    console.log('trimmed sentence: ', trimmedSentence);
    if (!trimmedSentence.includes('user') && !uniqueSentences.includes(trimmedSentence)) {
      uniqueSentences.push(trimmedSentence);
    }
  }
  //const trimmedSentences = uniqueSentences.map(sentence => sentence.trim());
  return uniqueSentences.join(' '); // Join the last 4 (or fewer) complete sentences
}


function updateLLM(response) {
  try {
    console.log('Updating background with LLM response:', response);
    chrome.runtime.sendMessage({ action: 'updateLLM', response: response });
  } catch (error) {
    console.error('Error in updateLLM:', error);
  }
}

function updateInterface(messages) {
  try {
    console.log('Updating background with messages:', messages);
    chrome.runtime.sendMessage({ action: 'updateInterface', messages: messages });
  } catch (error) {
    console.error('Error in updateInterface:', error);
  }
}


// Function to scrape the latest messages
function processLatestMessages() {
  try {
    var messageElements = document.querySelectorAll('.b-chats__item__last-message');
    if (!messageElements || messageElements.length === 0) {
      console.log('Latest message elements not found');
      return;
    }
    var messages = Array.from(messageElements).slice(0, 5).map(el => el.innerText);
    console.log('Latest messages:', messages);
    updateInterface(messages);
  } catch (error) {
    console.error('Error in processLatestMessages:', error);
  }
}


// get messages on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
  var checkExist = setInterval(function() {

      processLatestMessages();
      clearInterval(checkExist);

  }, 1000); // Check every 1000ms
  // If the element doesn't exist after a certain time, clear the interval
  setTimeout(function() {
    clearInterval(checkExist);
  }, 10000); // Stop checking after 10 seconds
});


// Listen to popup for a message to refresh messages
if (chrome.runtime) {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'refreshMessages') {
      console.log('Received request to refresh messages');
      processLatestMessages();
    }
  });
}


// Listen to popup for a message to send to LLM
if (chrome.runtime) {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'sendResponse') {
      console.log('Sending message to LLM:', request.message);
      // Get LLM response
      getLLMResponse(request.message, request.history).then((response) => {
        // Optionally, update the popup interface with the selected message and response
        // updateLLM(request.llmResponse);
      });
    }
  });
}

function setLatestMessage(response) {
  try {
    console.log('Setting latest message:', response);
    var messageField = document.querySelector('#new_post_text_input');
    if (messageField) {
      var inputEvent = new Event('input', { bubbles: true });
      messageField.textContent = response;
      console.log('messageField input: ', messageField.textContent);
      var sendButton = document.querySelector('.b-chat__btn-submit');
      if (sendButton) {
        console.log('sendButton: ', sendButton);
        sendButton.disabled = false;
        sendButton.addEventListener('click', function() {
          console.log('Send button clicked');
        });
      }
    }
  } catch (error) {
    console.error('Error in setLatestMessage:', error);
  }
}



// Function to set the latest message
async function setLatestMessage(response) {
  try {
    console.log('Setting latest message:', response);
    // Get fields by their parent and class name
    var messageField = document.querySelector('#new_post_text_input');

    if (messageField) {
      // Simulate the input event to mimic manual input
      var inputEvent = new Event('input', { bubbles: true });

      // Set the value of the messageField to the desired response
      messageField.value = response; // Use .value for input fields, .textContent for non-input elements

      // Trigger the 'input' event on the messageField
      messageField.dispatchEvent(inputEvent);

      // Find and click the send button if available
      var sendButton = document.querySelector('.b-chat__btn-submit');
      if (sendButton) {
        // Enable the button if it's disabled
        sendButton.disabled = false;

        // Wait for a brief moment to ensure the button is enabled (you can adjust the delay as needed)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Add an event listener to log when the button is clicked
        sendButton.addEventListener('click', function() {
          console.log('Send button clicked');
        });

        // Trigger a click event on the send button
        sendButton.click();
      } else {
        console.log('Send button not found.');
      }
    } else {
      console.log('Message field not found.');
    }

    // dispatch the event to allow send button to be enabled
    //messageField.dispatchEvent(inputEvent);

    // Uncomment the following code if needed
    /*
    var wordLimitElement = document.querySelector('.muser-wlimit');
    var audioButton = document.querySelector('.audio-icon.muser-sentbtn.aud-ico');
  
    if (wordLimitElement) {
      wordLimitElement.textContent = response.length + "/300"; // Assuming 300 is the word limit
    }
  
    var sendButton = document.querySelector('#sbbtn');
    if (sendButton) {
      console.log('sendButton: ', sendButton);
      sendButton.classList.remove('hide');
      sendButton.disabled = false;
  
      if (audioButton) {
        audioButton.classList.add('hide');
      }
  
      sendButton.addEventListener('click', function() {
        console.log('Send button clicked');
      });
  
      setTimeout(function() {
        sendButton.click();
      }, 1000);
    }
    */
  } catch (error) {
    console.error('Error in setLatestMessage:', error);
  }
}


// Listen to popup for a message to set the latest
if (chrome.runtime) {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'setLatest') {
      var response = request.response; // Access the 'response' property
      console.log('Received request to set the latest with response:', response);
      setLatestMessage(response); // Call your function with the 'response'
    }
  });
}

