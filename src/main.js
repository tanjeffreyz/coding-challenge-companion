chrome.runtime.onMessage.addListener((message) => {
    switch(message.type) {
        case 'set-access-token':
            chrome.storage.local.set({'access-token': message.token}, () => {});
            break;
    }
});
