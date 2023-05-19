// Initialize button with users' preferred color
const textareaTranslate = document.getElementById('textareaTranslate');

chrome.runtime.connect({ name: "fromPopup" });

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === 'gptLastResponse') {
      let receivedResponse = request.data;
      console.log(receivedResponse); // In ra nội dung từ GPT

      if (receivedResponse != "") {
        // textareaTranslate.textContent = receivedResponse;
        textareaTranslate.innerHTML = receivedResponse;
      }
      
      sendResponse({result: "Done"});
    }
    // else if (request.type === 'gptLastResponseToEmail') {
    //   console.log('gptLastResponseToEmail');
    //   console.log(request.data);
    //   sendResponse({result: "Done"});
    // }
    // Xử lý các loại tin nhắn khác tại đây...
  });

