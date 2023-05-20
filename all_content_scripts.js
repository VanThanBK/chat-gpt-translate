console.log("from extension")

// Định nghĩa biến để lưu vị trí con trỏ chuột
let cursorPosition = { x: 0, y: 0 };

// Lắng nghe sự kiện chuột phải
document.addEventListener('contextmenu', function (e) {
    cursorPosition = { x: e.clientX, y: e.clientY };
});

function passDataToInputOfCurrentPage(new_text) {
    if (focusCardTextInput) {
        focusCardTextInput.focus();
        // focusCardTextInput.textContent = new_text;
        // console.log(new_text);
        // console.log(focusCardTextInput);
        // console.log(document.activeElement);

        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, new_text);
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'showGptTranslatePopup') {
        sendResponse({ result: cursorPosition });
        showGptTranslatePopup();
        findTextInputCard();
    }
    else if (request.type === 'gptLastResponseToTranslate') {
        sendResponse({ result: "Done" });

        let divSuggest = document.querySelector('div[id="gpt-mail-suggest"]');
        if (divSuggest) {
            divSuggest.remove();
        }

        // console.log(request.data);

        copyToClipboard(request.data);
        passDataToInputOfCurrentPage(request.data);
    }
});

let focusCardTextInput = null;
function findTextInputCard() {
    let activeElement = document.activeElement;
    
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
        // console.log('The active element allows text input.');
        focusCardTextInput = activeElement;
    } else {
        // console.log('The active element does not allow text input.');
        focusCardTextInput = null;
    }
}

function copyToClipboard(text) {
    let textarea = document.createElement('textarea');
    textarea.id = 'tempElement';
    textarea.style.height = 0;
    document.body.appendChild(textarea);
    textarea.value = text;
    let selector = document.querySelector('#tempElement');
    selector.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

function injectedGptTranslateLoading() {
    let reply_gpt_mail_suggest_btn = document.querySelector('#reply-gpt-mail-suggest-btn');

    reply_gpt_mail_suggest_btn.insertAdjacentHTML('beforebegin', '<div class="tr-spinner"></div>');
}

function showGptTranslatePopup() {
    let popup_x_pos = cursorPosition.x - 200;
    let popup_y_pos = cursorPosition.y - 190;

    if (popup_x_pos < 0) {
        popup_x_pos = 0
    }

    let _width = window.innerWidth;
    let _height = window.innerHeight;

    if (popup_x_pos + 400 > _width) {
        popup_x_pos = _width - 400;
    }

    injectedGptMailSuggest(popup_x_pos, popup_y_pos);
}

let current_x_mail_suggest = 0;
let current_y_mail_suggest = 0;

function gpt_mail_suggest_close_btn_click(event) {
    if (event.button === 0) {
        let divSuggest = document.querySelector('div[id="gpt-mail-suggest"]');

        if (divSuggest) {
            divSuggest.remove();
        }
    }
}

function reply_gpt_mail_suggest_btn_click(event) {
    if (event.button === 0) {
        let buffer_text = "Dịch giúp tôi những ý sau:" + '\n';
        let gpt_mail_suggest_text = document.querySelector('#gpt-mail-suggest-text');
        if (gpt_mail_suggest_text.value === "") {
            return;
        }
        buffer_text += gpt_mail_suggest_text.value;

        chrome.runtime.sendMessage({ type: 'requestGptTranslate', data: buffer_text }, function (response) {
            // console.log(response);
        });

        injectedGptTranslateLoading();
    }
}

function injectedGptMailSuggest(x_pos, y_pos) {
    let body_bufer = document.body;
    let lastDiv = body_bufer.lastElementChild;

    if (!lastDiv) {
        return;
    }

    let divSuggest = document.querySelector('div[id="gpt-mail-suggest"]');

    if (divSuggest) {
        divSuggest.remove();
        return;
    }

    current_x_mail_suggest = x_pos;
    current_y_mail_suggest = y_pos;

    fetch(chrome.runtime.getURL('template/translate_popup.html'))
        .then(response => response.text())
        .then(data => {
            let new_translate3d = "translate3d(" + x_pos.toString() + "px, " + y_pos.toString() + "px, 0px)";
            let new_html = data.replace("translate3d(0px, 0px, 0px)", new_translate3d);
            lastDiv.insertAdjacentHTML('afterend', new_html);
        });

    setTimeout(function () {
        divSuggest = document.querySelector('div[id="gpt-mail-suggest"]');
        // console.log(divSuggest);
        if (divSuggest) {
            let gpt_mail_suggest_close_btn = document.querySelector('#gpt-mail-suggest-close-btn');
            let reply_gpt_mail_suggest_btn = document.querySelector('#reply-gpt-mail-suggest-btn');
            let gpt_mail_suggest_text = document.querySelector('#gpt-mail-suggest-text');

            gpt_mail_suggest_close_btn.addEventListener('click', gpt_mail_suggest_close_btn_click);
            reply_gpt_mail_suggest_btn.addEventListener('click', reply_gpt_mail_suggest_btn_click);
            gpt_mail_suggest_text.addEventListener('input', autoResizeSuggestText, false);

            gpt_mail_suggest_text.value = last_gpt_mail_suggest_text_value;
        }
    }, 500);
}

let last_gpt_mail_suggest_text_value = "";

function autoResizeSuggestText() {
    this.style.height = 'auto';
    let new_text_height = this.scrollHeight;
    if (new_text_height < 70) {
        new_text_height = 70;
    }
    else if (new_text_height > 300) {
        new_text_height = 300;
        this.style.overflowY = 'scroll';
    }
    else {
        this.style.overflowY = 'hidden';
    }

    let new_y_mail_suggest = current_y_mail_suggest - (new_text_height - 70);
    let new_x_mail_suggest = current_x_mail_suggest;

    let divSuggest = document.querySelector('div[id="gpt-mail-suggest"]');
    divSuggest.style.transform = `translate3d(${new_x_mail_suggest}px, ${new_y_mail_suggest}px, 0px)`;

    this.style.height = new_text_height + 'px';

    last_gpt_mail_suggest_text_value = this.value;
}