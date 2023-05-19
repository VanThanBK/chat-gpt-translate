
chrome.runtime.onInstalled.addListener(() => {

});

let popupOpen = false;
let lastResponseFromChatGPT = "";
let email_wait_response = false;
let current_gmail_tab_wait_response = null;

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === "fromPopup") {
    popupOpen = true;
    sendLastResponseToPopup();
    port.onDisconnect.addListener(function () {
      popupOpen = false;
    });
  }
});

function sendLastResponseToPopup() {
  if (popupOpen == true) {
    chrome.runtime.sendMessage({ type: 'gptLastResponse', data: lastResponseFromChatGPT }, function (response) {
    });
  }
}

function sendLastResponseToEmail() {
  chrome.tabs.sendMessage(current_gmail_tab_wait_response, { type: 'gptLastResponseToEmail', data: lastResponseFromChatGPT }, function (response) {
  });
}

// tạo nút gpt trong chuột phải
chrome.contextMenus.remove("rightMouseGptTranslate", function () {
  if (chrome.runtime.lastError) {
  } else {
  }
  chrome.contextMenus.create({
    id: "rightMouseGptTranslate",
    title: "GPT Translate",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "rightMouseGptTranslate") {
    if (info.selectionText != "") {
      let buffer_text = "Dịch giúp tôi mail sau:" + '\n';
      buffer_text += info.selectionText;
      pasteToTranslateTabInChatGPT(buffer_text);
    }
  }
});

function pasteToTranslateTabInChatGPT(input_text) {
  let chat_gpt_mail_url_bug = ""
  chrome.storage.sync.get('chat_gpt_mail_url', function (data) {
    chat_gpt_mail_url_bug = data.chat_gpt_mail_url;
    // console.log(chat_gpt_mail_url_bug)

    chrome.tabs.query({ url: [chat_gpt_mail_url_bug + "*"] }, function (tabs) {
      if (tabs.length > 0) {
        var gptTabId = tabs[0].id;
        addScriptingToChatGptTab(gptTabId, input_text);
      }
      else {
        chrome.tabs.create({ url: chat_gpt_mail_url_bug, active: false }, function (tab) {
          let newTabId = tab.id;
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === 'complete' && tabId === newTabId) {
              setTimeout(function () {
                addScriptingToChatGptTab(tabId, input_text);
              }, 2500);
              
              chrome.tabs.onUpdated.removeListener(listener);
            }
          });
        });
      }
    });

  });
}

function addScriptingToChatGptTab(gptTabId, input_text) {
  chrome.scripting.executeScript(
    { target: { tabId: gptTabId }, args: [input_text], func: addTextToInputInPageAndEnter },
    function () { console.log("Thêm văn bản vào ô input thành công"); }
  );

  chrome.scripting.executeScript(
    { target: { tabId: gptTabId }, func: waitLastResponseInGPT },
    function () { console.log("Đợi phản hồi"); }
  );
}

function addTextToInputInPageAndEnter(input_text) {
  var input = document.querySelector('textarea');
  if (input) {
    input.value = input_text;

    var enterKeyEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      charCode: 13,
      bubbles: true,
      cancelable: true,
      view: window,
    });
    input.dispatchEvent(enterKeyEvent);
  }
  else {
    console.log("Không tìm thấy ô input");
  }
}

function waitLastResponseInGPT() {
  //kiểm tra phản hồi hoàn thành
  const callbackbtn = function (mutationsList, observer) {
    // console.log("CallbackBtn...");
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {

        let responseElements = document.querySelectorAll('.flex.w-full.gap-2.items-center.justify-center');
        let latestResponseElement = responseElements[responseElements.length - 1];
        let responseText = latestResponseElement.innerText;
        // console.log(responseText);

        if (responseText === "Regenerate response") {
          observer.disconnect();

          let responseGroup = document.querySelectorAll('.group.w-full.text-gray-800.border-b');
          let latestResponseGroup = responseGroup[responseGroup.length - 1];
          let lastResponseDiv = latestResponseGroup.querySelector('.markdown.prose.w-full.break-words');

          // let lastResponseText = lastResponseDiv.textContent;
          let lastResponseText = lastResponseDiv.innerHTML;
          // console.log(lastResponseText);

          //gửi dữ liệu tới background
          chrome.runtime.sendMessage({ type: 'responseFromChatGPT', data: lastResponseText }, function (response) {
            // console.log(response);
          });
        }
      }
    }
  };

  const observer_btn = new MutationObserver(callbackbtn);
  let targetNodebtn = document.querySelector('.h-full.flex.ml-1.gap-0.justify-center');
  let configbtn = { childList: true, subtree: true };
  observer_btn.observe(targetNodebtn, configbtn);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'responseFromChatGPT') {
    lastResponseFromChatGPT = request.data;
    sendResponse({ result: "Done" });

    sendLastResponseToPopup();
    if (email_wait_response) {
      sendLastResponseToEmail();
      email_wait_response = false;
    }
  }
  else if (request.type === 'requestReplyEmail') {
    pasteToTranslateTabInChatGPT(request.data);
    email_wait_response = true;
    current_gmail_tab_wait_response = sender.tab.id;
    sendResponse({ result: "Done" });
  }
  else if (request.type == 'openOptionsPage') {
    chrome.runtime.openOptionsPage();
  }
});