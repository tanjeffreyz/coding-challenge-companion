KEYS = [
    'access-token',
    'email'
];


chrome.runtime.onMessage.addListener((message) => {
    let response = null;
    switch(message.type) {
        case 'clear-storage':
            for (let i = 0; i < KEYS.length; i++) {
                const dict = {};
                dict[KEYS[i]] = null;
                chrome.storage.local.set(dict, () => {});
            }
            break;
        case 'upload-file':
            // chrome.storage.
            break;
    }
    message.reponse = response;
});
