console.log("gmail page loaded!");

let divElementMailContainer = null;
let config_observer = { childList: true, subtree: true };
let observer = null;

let gpt_mail_agree_btn = null;
let gpt_mail_refuse_btn = null;
let gpt_mail_suggest_btn = null;
let gpt_mail_setting_btn = null;

let divEmailReplyBox = null;

let text_mouse_selection = ""
function check_text_mouse_selection() {
    text_mouse_selection = window.getSelection().toString();
    if (text_mouse_selection.length < 10) {
        text_mouse_selection = "";
    }
}

function gpt_mail_agree_btn_click(event) {
    if (event.button === 0) {
        check_text_mouse_selection();
        let buffer_text = "Trả lời giúp tôi mail sau với xu hướng là đồng ý hoặc chấp thuận:" + '\n';
        buffer_text += findEmailNeedReply();
        requestReplyEmailToBg(buffer_text);
    }
}

function gpt_mail_refuse_btn_click(event) {
    if (event.button === 0) {
        check_text_mouse_selection();
        let buffer_text = "Trả lời giúp tôi mail sau với xu hướng là từ chối hoặc trung gian:" + '\n';
        buffer_text += findEmailNeedReply();
        requestReplyEmailToBg(buffer_text);
    }
}

function gpt_mail_suggest_btn_click(event) {
    if (event.button === 0) {
        check_text_mouse_selection();

        var x = event.clientX - event.offsetX - 200;
        var y = event.clientY - event.offsetY - 170;

        injectedGptMailSuggest(x, y);
    }
}

function gpt_mail_setting_btn_click(event) {
    if (event.button === 0) {
        chrome.runtime.sendMessage({ type: 'openOptionsPage' }, function (response) {
            // console.log(response);
        });
    }
}

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
        let buffer_text = "Trả lời giúp tôi mail sau với những gợi ý:" + '\n';
        let gpt_mail_suggest_text = document.querySelector('#gpt-mail-suggest-text');
        if (gpt_mail_suggest_text.value === "") {
            return;
        }
        buffer_text += gpt_mail_suggest_text.value;
        buffer_text += '\n' + "Email:" + '\n';

        buffer_text += findEmailNeedReply();
        requestReplyEmailToBg(buffer_text);

        let divSuggest = document.querySelector('div[id="gpt-mail-suggest"]');

        if (divSuggest) {
            divSuggest.remove();
        }
    }
}

let current_x_mail_suggest = 0;
let current_y_mail_suggest = 0;

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

    fetch(chrome.runtime.getURL('template/suggest_popup.html'))
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

function findEmailNeedReply() {
    if (text_mouse_selection.length > 10) {
        return text_mouse_selection;
    }

    let emailNeedReply = document.querySelector('div.a3s.aiL');
    // console.log(emailNeedReply.textContent)
    let emailNeedReply_filter = emailNeedReply.cloneNode(true);

    // Tìm tất cả các thẻ con chứa class .exclude-class
    let excludeNode = emailNeedReply_filter.querySelector('.yj6qo.ajU');
    if (excludeNode) {
        // Xóa thẻ chứa class .exclude-class và tất cả thẻ sau nó
        while (excludeNode) {
            let nextNode = excludeNode.nextSibling;  // lưu thẻ tiếp theo
            excludeNode.parentNode.removeChild(excludeNode);  // xóa thẻ hiện tại
            excludeNode = nextNode;  // di chuyển đến thẻ tiếp theo
        }
    }

    let blockquoteElements = emailNeedReply_filter.querySelectorAll('blockquote');
    blockquoteElements.forEach(node => {
        node.remove();
    });

    let gmail_quote_Node = emailNeedReply_filter.querySelector('.gmail_quote');
    if (gmail_quote_Node) {
        // Xóa thẻ chứa class .exclude-class và tất cả thẻ sau nó
        while (gmail_quote_Node) {
            let nextNode = gmail_quote_Node.nextSibling;  // lưu thẻ tiếp theo
            gmail_quote_Node.parentNode.removeChild(gmail_quote_Node);  // xóa thẻ hiện tại
            gmail_quote_Node = nextNode;  // di chuyển đến thẻ tiếp theo
        }
    }

    // console.log(emailNeedReply_filter)

    return emailNeedReply_filter.textContent;
}

function requestReplyEmailToBg(mailContent) {
    injectedGptMailLoading();

    chrome.runtime.sendMessage({ type: 'requestReplyEmail', data: mailContent }, function (response) {
        // console.log(response);
    });
}



window.onload = function () {
    divElementMailContainer = document.querySelector('div[id=":1"]');
    if (divElementMailContainer) {
        startTrackingChangeOfMailContainer();
    }


};

function startTrackingChangeOfMailContainer() {
    observer = new MutationObserver(function (mutations) {
        checkExtensionnInReplyMail();
    });

    observer.observe(divElementMailContainer, config_observer);
}

function checkExtensionnInReplyMail() {
    let divGptMailToolbar = document.querySelector('td[id="gpt-mail-toolbar"]');
    divEmailReplyBox = document.querySelector('div.ip.adB')

    if (divGptMailToolbar) {
        // console.log(divGptMailToolbar);
        if (gpt_mail_agree_btn == null || gpt_mail_refuse_btn == null || gpt_mail_suggest_btn == null || gpt_mail_setting_btn == null) {
            gpt_mail_agree_btn = divGptMailToolbar.querySelector('#chat-gpt-agree-btn');
            gpt_mail_refuse_btn = divGptMailToolbar.querySelector('#chat-gpt-refuse-btn');
            gpt_mail_suggest_btn = divGptMailToolbar.querySelector('#chat-gpt-suggest-btn');
            gpt_mail_setting_btn = divGptMailToolbar.querySelector('#chat-gpt-setting-btn');
            addEventListenerToolbarButton();
        }
    }
    else {
        // console.log(divEmailReplyBox);
        gpt_mail_agree_btn = null;
        gpt_mail_refuse_btn = null;
        gpt_mail_suggest_btn = null;
        gpt_mail_setting_btn = null;
        if (divEmailReplyBox) {
            injectedGptMailToolbar();
        }
    }
}

function addEventListenerToolbarButton() {
    gpt_mail_agree_btn.addEventListener('click', gpt_mail_agree_btn_click);
    gpt_mail_refuse_btn.addEventListener('click', gpt_mail_refuse_btn_click);
    gpt_mail_suggest_btn.addEventListener('click', gpt_mail_suggest_btn_click);
    gpt_mail_setting_btn.addEventListener('click', gpt_mail_setting_btn_click);
}

function injectedGptMailToolbar() {
    let tdElement = document.querySelector('td.gU.Up');
    if (!tdElement) {
        return;
    }

    fetch(chrome.runtime.getURL('template/toolbar.html'))
        .then(response => response.text())
        .then(data => {
            tdElement.insertAdjacentHTML('afterend', data);
        });

    observer.disconnect();

    setTimeout(function () {
        startTrackingChangeOfMailContainer();
    }, 500);
}

function injectedGptMailLoading() {
    if (divEmailReplyBox == null) {
        return;
    }

    let divElement = divEmailReplyBox.querySelector('div.aO7');

    if (!divElement) {
        return;
    }

    fetch(chrome.runtime.getURL('template/loading.html'))
        .then(response => response.text())
        .then(data => {
            divElement.insertAdjacentHTML('beforebegin', data);
        });
}

function deleteGptMailLoading() {
    if (divEmailReplyBox == null) {
        return;
    }

    let gptMailLoading = divEmailReplyBox.querySelector('div[id="gpt-mail-loading"]');

    if (gptMailLoading) {
        gptMailLoading.remove();
    }
}



function insertGptMailToReplyBox(reply) {
    if (divEmailReplyBox == null) {
        return;
    }

    let divElement = divEmailReplyBox.querySelector('div.aO7');

    if (!divElement) {
        return;
    }

    let inputTextDivInReplyBox = divElement.querySelector('div.Am.aO9');

    if (!inputTextDivInReplyBox) {
        return;
    }

    // inputTextDivInReplyBox.insertAdjacentHTML('beforeend', reply);
    inputTextDivInReplyBox.innerHTML = reply;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'gptLastResponseToEmail') {
        let lastResponseFromChatGPT = request.data;
        sendResponse({ result: "Done" });
        // console.log(lastResponseFromChatGPT);
        insertGptMailToReplyBox(lastResponseFromChatGPT);
        deleteGptMailLoading();
    }
});

