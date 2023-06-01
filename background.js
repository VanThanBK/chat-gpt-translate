
chrome.runtime.onInstalled.addListener(() => {

});

let popupOpen = false;
let lastResponseFromChatGPT = "";
let email_wait_response = false;
let current_gmail_tab_wait_response = null;

let translate_wait_response = false;
let current_translate_tab_wait_response = null;

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

function sendLastResponseToTranslate() {
  chrome.tabs.sendMessage(current_translate_tab_wait_response, { type: 'gptLastResponseToTranslate', data: lastResponseFromChatGPT }, function (response) {
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
    // if (info.selectionText != "" && info.selectionText != null) {
    //   let buffer_text = "Dịch giúp tôi mail sau:" + '\n';
    //   buffer_text += info.selectionText;
    //   pasteToTranslateTabInChatGPT(buffer_text);
    // }
    chrome.tabs.sendMessage(tab.id, { type: 'showGptTranslatePopup' }, function (response) {
      // console.log(response);
    });
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

    const button_gpt = document.querySelector('.absolute.p-1.rounded-md');
    if (button_gpt) {
      button_gpt.removeAttribute('disabled');
      button_gpt.style.backgroundColor = 'rgb(25, 195, 125)';

      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });

      button_gpt.dispatchEvent(clickEvent);
    } else {
      console.log('Không tìm thấy button');
    }

    // var enterKeyEvent = new KeyboardEvent('keydown', {
    //   key: 'Enter',
    //   code: 'Enter',
    //   keyCode: 13,
    //   charCode: 13,
    //   bubbles: true,
    //   cancelable: true,
    //   view: window,
    // });
    // input.dispatchEvent(enterKeyEvent);

    // var keyUpEvent = new KeyboardEvent('keyup', {
    //   key: 'Enter',
    //   code: 'Enter',
    //   keyCode: 13,
    //   charCode: 13,
    //   bubbles: true,
    //   cancelable: true,
    //   view: window
    // });

    // input.dispatchEvent(keyUpEvent);
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
        // console.log("chatgptchange");
        let responseElements = document.querySelectorAll('.flex.w-full.gap-2.items-center.justify-center');
        let latestResponseElement = responseElements[responseElements.length - 1];
        let responseText = latestResponseElement.innerText;
        // console.log(responseText);

        if (responseText === "Regenerate response") {
          observer.disconnect();

          let responseGroup = document.querySelectorAll('.group.w-full.text-gray-800.border-b');
          let latestResponseGroup = responseGroup[responseGroup.length - 1];
          let lastResponseDiv = latestResponseGroup.querySelector('.markdown.prose.w-full.break-words');

          let lastResponseText1 = lastResponseDiv.textContent;
          let lastResponseText = lastResponseDiv.innerHTML;
          // console.log(lastResponseText);

          //gửi dữ liệu tới background
          chrome.runtime.sendMessage({ type: 'responseFromChatGPT', data: lastResponseText, data1: lastResponseText1 }, function (response) {
            // console.log(response);
          });
        }
      }
    }
  };

  const observer_btn = new MutationObserver(callbackbtn);
  // let targetNodebtn = document.querySelector('.relative.h-full.w-full.transition-width.flex.lex-col');
  let targetNodebtn = document.querySelector('div.relative.flex.h-full.max-w-full.flex-1.overflow-hidden');
  if (targetNodebtn) {
    let configbtn = { childList: true, subtree: true };
    observer_btn.observe(targetNodebtn, configbtn);
  }
  else {
    console.log("khong có: targetNodebtn");
  }
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
    if (translate_wait_response) {
      lastResponseFromChatGPT = request.data1
      sendLastResponseToTranslate();
      translate_wait_response = false;
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
  else if (request.type == 'requestGptTranslate') {
    pasteToTranslateTabInChatGPT(request.data);
    sendResponse({ result: "Done" });
    current_translate_tab_wait_response = sender.tab.id;
    translate_wait_response = true;
  }
});