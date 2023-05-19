const url_text_input = document.getElementById('url-text-input');
const url_submit_button = document.getElementById('submit-button');

url_submit_button.addEventListener('click', url_submit_button_click);

chrome.storage.sync.get('chat_gpt_mail_url', function (data) {
  url_text_input.value = data.chat_gpt_mail_url;
});

function url_submit_button_click(event) {
  if (event.button === 0) {
    if (url_text_input.value != "") {
      let chat_gpt_mail_url = url_text_input.value;
      
      chrome.storage.sync.set({ chat_gpt_mail_url });

      chrome.tabs.query({ url: [chat_gpt_mail_url + "*"] }, function (tabs) {
        if (tabs.length > 0) {

        }
        else {
          chrome.tabs.create({ url: chat_gpt_mail_url });
        }
      });
    }
  }
}
