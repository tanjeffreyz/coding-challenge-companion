KEYS = [
    'access-token'
];


chrome.runtime.onMessage.addListener((message) => {
    switch(message.type) {
        case 'clear-storage':
            for (let i = 0; i < KEYS.length; i++) {
                const dict = {};
                dict[KEYS[i]] = null;
                chrome.storage.local.set(dict, () => {});
            }
            break;
    }
});
